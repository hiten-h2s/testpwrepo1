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
const isVercel = Boolean(process.env.VERCEL);

// Required behind Vercel / any reverse proxy so req.ip is correct
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Ensure Mongo is ready before handling API traffic (esp. serverless cold starts)
let dbReady;
function connectDatabase() {
    if (!dbReady) {
        if (!process.env.MONGODB_URI) {
            dbReady = Promise.reject(new Error('MONGODB_URI is not set'));
        } else {
            dbReady = mongoose
                .connect(process.env.MONGODB_URI)
                .then(async () => {
                    console.log('Connected to MongoDB');
                    await seedDemoAccounts();
                });
        }
    }
    return dbReady;
}

app.use(async (req, res, next) => {
    try {
        await connectDatabase();
        next();
    } catch (err) {
        console.error('Failed to connect to MongoDB');
        res.status(503).json({ error: 'Database unavailable' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

if (!isVercel) {
    connectDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch(() => {
            console.error('Failed to connect to MongoDB');
            if (process.env.NODE_ENV !== 'production') {
                process.exit(1);
            }
        });
}

module.exports = app;
