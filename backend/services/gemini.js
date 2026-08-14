const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const triagePrompt = `You are a triage classifier for a recovery-support app used in India.
Input may be in English, Hindi, or any major Indian language (Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, etc.).
You MUST recognize and process code-mixed forms (like Hinglish, Manglish, Tanglish, Benglish) natively without forcing translation into English prior to classification. The input may be fragmented or emotional.

Classify into exactly one category:
- LOW: reflective, wants grounding/distraction
- MEDIUM: active craving, wants a support script or contact
- HIGH: mentions overdose, physical danger, explicit crisis language, or severe withdrawal symptoms

Never generate advice or commentary. If ambiguous, default to the higher-risk category.`;

async function classifyTriage(text) {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: triagePrompt + '\n\nInput text: "' + text + '"' }] }
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type?.OBJECT || 'OBJECT',
                properties: {
                    category: { type: Type?.STRING || 'STRING', enum: ["LOW", "MEDIUM", "HIGH"] },
                    detected_language: { type: Type?.STRING || 'STRING' },
                    confidence: { type: Type?.NUMBER || 'NUMBER' },
                    bypassed_genai: { type: Type?.BOOLEAN || 'BOOLEAN' },
                    timestamp: { type: Type?.STRING || 'STRING' }
                },
                required: ["category", "detected_language", "confidence", "bypassed_genai", "timestamp"]
            }
        }
    });

    return JSON.parse(response.text);
}

module.exports = {
    classifyTriage,
    ai
};
