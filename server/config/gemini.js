import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client with API key from environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const getModel = (modelName = 'gemini-1.5-flash') => {
    return genAI.getGenerativeModel({ model: modelName });
};

export default genAI;


