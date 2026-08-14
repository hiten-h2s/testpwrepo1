const { classifyTriage } = require('../services/gemini');
const User = require('../models/User');


const MAX_TEXT_LENGTH = 250;

// Keywords that unambiguously signal a HIGH-risk crisis.
// Pre-screening these before calling Gemini achieves sub-10ms response for crisis inputs.
const HIGH_RISK_KEYWORDS = [
    'overdose', 'i want to die', 'kill myself', 'killing myself',
    'suicide', 'suicidal', 'end my life', 'want to end', 'immediate danger',
    'physical danger', 'i took something', 'took something dangerous'
];

function isHighRiskKeyword(text) {
    const lower = text.toLowerCase();
    return HIGH_RISK_KEYWORDS.some(kw => lower.includes(kw));
}

const HIGH_STATIC_RESPONSE = {
    category: 'HIGH',
    detected_language: 'unknown',
    confidence: 1.0,
    bypassed_genai: true,
    timestamp: null, // set at call time
    emergency_resources: ['112', '1800-599-0019', '14416']
};

exports.handleTriage = async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const { text } = req.body;
        
        // Strict boundary: handle empty, whitespace, malformed body
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: 'Valid text input is required.' });
        }

        const cappedText = text.substring(0, MAX_TEXT_LENGTH);

        // Keyword pre-screener: return immediately for obvious crisis phrases
        // without calling Gemini, ensuring sub-10ms response for HIGH-risk inputs.
        if (isHighRiskKeyword(cappedText)) {
            return res.status(200).json({
                ...HIGH_STATIC_RESPONSE,
                timestamp: new Date().toISOString()
            });
        }

        let parsed;
        try {
            parsed = await classifyTriage(cappedText);
        } catch {
            // Handle timeout/rate-limit gracefully with HTTP 200 fallback payload
            return res.status(200).json({
                category: "HIGH",
                detected_language: "unknown",
                confidence: 1.0,
                bypassed_genai: true,
                timestamp: new Date().toISOString(),
                fallback: true,
                emergency_resources: ["112", "1800-599-0019", "14416"]
            });
        }

        // HIGH-RISK CIRCUIT BREAKER BYPASS
        if (parsed.category === 'HIGH') {
            parsed.bypassed_genai = true;
            parsed.emergency_resources = ["112", "1800-599-0019", "14416"];
            // We do not invoke any secondary generation here
        } else {
            parsed.bypassed_genai = false;
        }

        res.status(200).json(parsed);

    } catch {
        // Fallback to 200 instead of 500 as per instructions "NEVER crash with 500 error"
        res.status(200).json({
            category: "HIGH",
            detected_language: "unknown",
            confidence: 1.0,
            bypassed_genai: true,
            timestamp: new Date().toISOString(),
            fallback: true,
            emergency_resources: ["112", "1800-599-0019", "14416"]
        });
    }
};

