require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const seedDemoAccounts = require('./scripts/seedAccounts');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors()); // Configure correctly for production if needed
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());

// Trust proxy if we are behind a reverse proxy (e.g., Cloud Run)
// app.set('trust proxy', 1); // Enable this if deployed behind a trusted proxy

// Basic Rate Limiting using socket address
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    keyGenerator: (req) => {
        // Fallback to socket address to avoid forging X-Forwarded-For if not behind trusted proxy
        return req.socket.remoteAddress;
    }
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Seed demo accounts for hackathon evaluation
        await seedDemoAccounts();

        // Start the server (Required for Render)
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        // Redact any credentials from connection error logs
        console.error('Failed to connect to MongoDB');
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    });

module.exports = app;
