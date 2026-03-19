'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY,
});

/**
 * Transcribes audio using OpenAI Whisper.
 */
export async function transcribeAudio(formData: FormData): Promise<string> {
    const audioFile = formData.get('audio') as File;
    if (!audioFile) throw new Error('No audio file provided');

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });

        return transcription.text;
    } catch (error: any) {
        console.error('Whisper Transcription Error:', error);
        throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
}
