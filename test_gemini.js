require('dotenv').config({ path: 'backend/.env' });
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'say hello'
        });
        console.log(typeof response.text);
    } catch(e) {
        console.error(e);
    }
}
test();
