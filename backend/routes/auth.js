const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    keyGenerator: (req) => req.socket.remoteAddress,
    message: { error: 'Too many authentication attempts. Please try again later.' }
});

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const setCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// SIGNUP
router.post('/signup', authLimiter, async (req, res) => {
    try {
        const { email, password, role, inviteCode } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (!['patient', 'caregiver'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUserObj = {
            email,
            passwordHash,
            role
        };

        if (role === 'patient') {
            // Generate a short invite code
            newUserObj.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        } else if (role === 'caregiver') {
            if (!inviteCode) {
                return res.status(400).json({ error: 'Invite code is required for caregivers' });
            }
            const linkedPatient = await User.findOne({ inviteCode, role: 'patient' });
            if (!linkedPatient) {
                return res.status(400).json({ error: 'Invalid invite code' });
            }
            newUserObj.linkedPatientId = linkedPatient._id;
        }

        const user = new User(newUserObj);
        await user.save();

        const token = generateToken(user._id);
        setCookie(res, token);

        res.status(201).json(user);
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// LOGIN
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        setCookie(res, token);

        res.json(user);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// GET CURRENT USER & PROFILE
router.get('/me', auth, async (req, res) => {
    try {
        let profileData = null;
        if (req.user.role === 'patient') {
            profileData = await Profile.findOne({ userId: req.user._id });
        } else if (req.user.role === 'caregiver') {
            profileData = await Profile.findOne({ userId: req.user.linkedPatientId });
        }

        res.json({
            user: req.user,
            profile: profileData
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching user data' });
    }
});

module.exports = router;
