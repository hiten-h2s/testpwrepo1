const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const triageController = require('../controllers/triageController');

const MAX_TRIAGE_LENGTH = 250;

// Route-level input truncation middleware — caps text before it reaches any controller
// to minimise token overhead and latency on Gemini calls.
function truncateInput(req, _res, next) {
    if (req.body && typeof req.body.text === 'string') {
        req.body.text = req.body.text.substring(0, MAX_TRIAGE_LENGTH);
    }
    next();
}

// POST /api/triage
router.post('/', auth, truncateInput, triageController.handleTriage);

module.exports = router;

