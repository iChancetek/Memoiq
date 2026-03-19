import OpenAI from 'openai';

const apiKey = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error('Missing OpenAI API Key. Please set OPENAI_API_KEY in your environment variables.');
}

export const openai = new OpenAI({
    apiKey: apiKey,
});
