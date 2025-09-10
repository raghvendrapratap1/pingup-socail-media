import { getModel } from '../config/gemini.js';

// GET /api/gemini/ping → quick health check
export const ping = async (req, res) => {
    try {
        return res.json({ success: true, message: 'Gemini service ready' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/gemini/chat → generate text from conversation
export const chat = async (req, res) => {
    try {
        const { messages = [], images = [], maxTokens = 1000, temperature = 0.7, model = 'gemini-1.5-flash' } = req.body || {};

        const modelClient = getModel(model);

        // Get the last user message (most recent)
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        const prompt = lastUserMessage?.content || 'Hello';

        // Build parts: text + optional images
        const parts = [];
        parts.push({ text: prompt });

        // Handle images - only from the current request
        (images || []).forEach((img) => {
            if (!img) return;
            if (typeof img === 'string' && img.startsWith('data:')) {
                // Extract mime type and data from data URL
                const [header, data] = img.split(',');
                const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
                parts.push({ 
                    inlineData: { 
                        mimeType, 
                        data: data || '' 
                    } 
                });
            }
        });

        const result = await modelClient.generateContent({
            contents: [
                {
                    role: 'user',
                    parts
                }
            ],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens
            }
        });

        const text = result?.response?.text?.() || '';

        return res.json({ success: true, data: { response: text } });
    } catch (err) {
        console.error('Gemini API Error:', err);
        const status = err.status || 500;
        return res.status(status).json({ success: false, message: err.message || 'Gemini request failed' });
    }
};


