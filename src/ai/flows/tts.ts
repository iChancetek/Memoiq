'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY,
});

/**
 * Generates speech from text using OpenAI TTS.
 * Returns a base64 encoded audio string.
 */
export async function generateSpeech(text: string): Promise<string> {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer.toString('base64');
    } catch (error: any) {
        console.error('OpenAI TTS Error:', error);
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
}
