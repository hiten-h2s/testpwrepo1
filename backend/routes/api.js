const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');
const { ai } = require('../services/gemini');
const auth = require('../middleware/auth');
const triageRoutes = require('./triage');
const MAX_TEXT_LENGTH = 500;

router.use('/triage', triageRoutes);

// POST /api/profile (Patient only)
router.post('/profile', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Only patients can update their profile' });
        }

        let { name, trusted_contact, calming_phrase } = req.body;
        
        name = name ? String(name).substring(0, 100) : '';
        trusted_contact = trusted_contact ? String(trusted_contact).substring(0, 100) : '';
        calming_phrase = calming_phrase ? String(calming_phrase).substring(0, 250) : '';

        // Upsert profile for the logged in patient
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { name, trusted_contact, calming_phrase },
            { new: true, upsert: true, runValidators: true }
        );
        
        res.status(200).json({ success: true, profile });
    } catch {
        res.status(200).json({ success: false, error: 'Unable to save profile at this time.' });
    }
});

// POST /api/generate (Patient only)
router.post('/generate', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const { text, category } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text required' });
        }
        
        const cappedText = text.substring(0, MAX_TEXT_LENGTH);
        const profile = await Profile.findOne({ userId: req.user._id });
        
        const name = String(profile?.name || '').substring(0, 100);
        const contact_name = String(profile?.trusted_contact || '').substring(0, 100);
        const phrase = String(profile?.calming_phrase || '').substring(0, 250);

        // RAG Retrieval
        let retrievedSnippets = '';
        if (category === 'LOW' || category === 'MEDIUM') {
            const snippets = await KnowledgeBase.find({ audience: 'patient', category: category });
            retrievedSnippets = snippets.map(s => `- ${s.text}`).join('\n');
        }

        const prompt = `You write a short, calming message for someone in early craving/distress. 
Ground your message in the reference facts below — you may paraphrase and 
personalize them, but do not contradict them or invent unrelated advice.

Reference facts (retrieved, vetted — use these, don't invent new coping 
techniques):
${retrievedSnippets}

Profile: name=${name}, trusted_contact=${contact_name}, calming_phrase=${phrase}
User's input: ${cappedText}

Language requirement for Text-To-Speech: Detect the primary language of the user's input. Respond strictly in ONE pure language (e.g. pure English, pure Hindi, pure Tamil). DO NOT use code-mixed languages like Hinglish, Manglish, or Tanglish, as they sound unnatural when spoken by standard TTS voices. 

Output under 40 words. Plain, warm language — avoid clinical terms like 
"relapse", "sponsor", "sober", "therapy", or "addict". Do not simply copy a reference fact verbatim — 
personalize and phrase it naturally.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        res.json({ message: response.text });
    } catch {
        res.status(200).json({ message: 'I am here for you. Please take a deep breath.' });
    }
});

// POST /api/caregiver/respond (Caregiver only)
router.post('/caregiver/respond', auth, async (req, res) => {
    try {
        if (req.user.role !== 'caregiver') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        if (!req.user.linkedPatientId) {
            return res.status(403).json({ error: 'No patient linked to this account' });
        }

        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text required' });
        }

        const cappedText = text.substring(0, MAX_TEXT_LENGTH);

        // RAG Retrieval for Caregiver
        const snippets = await KnowledgeBase.find({ audience: 'caregiver', category: 'caregiver_deescalation' });
        const retrievedSnippets = snippets.map(s => `- ${s.text}`).join('\n');

        const prompt = `You help a caregiver (friend, family member, or peer) respond calmly to 
someone they support who may be in a craving or distress moment, in India. 
Input may be in English, Hindi, or any major Indian language, including 
code-mixed forms (like Hinglish, Manglish, Tanglish, etc.), and may be anxious or fragmented.

Ground your response in the reference facts below — paraphrase and adapt 
them, don't contradict them or invent unrelated advice:
Reference facts (retrieved, vetted):
${retrievedSnippets}

Generate a short, calm script the caregiver can say out loud, plus one brief 
"avoid saying" tip, and a physical grounding action. Do not diagnose, do not suggest medication or dosages, do 
not instruct on anything beyond calm de-escalation and when to seek 
emergency help.
If the input describes physical danger, overdose signs, or a medical 
emergency, respond ONLY with: 
{"emergency": true} 
and nothing else — do not generate a script in this case.
Otherwise return only JSON: 
{"emergency": false, "script": "...", "avoid_tip": "...", "physical_action": "..."}
Keep the script under 40 words, warm, plain language, no clinical jargon. 
Language: Detect and respond in the same language as the caregiver's input (including Hinglish, Manglish, Tanglish, etc.). Match exactly.

Caregiver's input: "${cappedText}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const output = response.text;
        const parsed = JSON.parse(output);

        res.json(parsed);
    } catch {
        res.status(200).json({ 
            emergency: false, 
            script: "I am here for you. Please take a deep breath.", 
            avoid_tip: "Avoid arguing or raising your voice.", 
            physical_action: "Offer a glass of water." 
        });
    }
});

// GET /api/caregiver/alert-status (Caregiver only)
router.get('/caregiver/alert-status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'caregiver') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ pendingAlert: user.pendingAlert, lastAlertText: user.lastAlertText });
    } catch {
        res.status(200).json({ pendingAlert: false, lastAlertText: '' });
    }
});

// POST /api/caregiver/clear-alert (Caregiver only)
router.post('/caregiver/clear-alert', auth, async (req, res) => {
    try {
        if (req.user.role !== 'caregiver') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        await User.findByIdAndUpdate(req.user._id, { $set: { pendingAlert: false } });
        res.json({ success: true });
    } catch {
        res.status(200).json({ success: false });
    }
});

// POST /api/caregiver/alert (Patient only)
router.post('/caregiver/alert', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        
        const { text } = req.body;
        const cappedText = text ? String(text).substring(0, MAX_TEXT_LENGTH) : 'Patient requested immediate support.';

        await User.updateMany(
            { linkedPatientId: req.user._id, role: 'caregiver' },
            { $set: { pendingAlert: true, lastAlertText: cappedText } }
        );

        res.json({ success: true });
    } catch {
        res.status(200).json({ success: false });
    }
});

module.exports = router;
