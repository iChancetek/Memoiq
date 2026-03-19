
'use server';
/**
 * @fileOverview A voice transcription AI agent.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z.string().describe("Data URI: 'data:<mimetype>;base64,<encoded_data>'."),
  language: z.enum(['en', 'es']).describe("The language of the audio."),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  const { audioDataUri } = input;
  
  try {
    // Extract base64 and mime type
    const matches = audioDataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid audio data URI format');
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a temporary file-like object for Whisper
    // In Next.js server actions, we can use a Buffer with a filename
    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, `audio.${mimeType.split('/')[1] || 'webm'}`, { type: mimeType }),
      model: "whisper-1",
    });

    return { transcription: transcription.text };
  } catch (error: any) {
    console.error('Whisper Transcription Error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

import OpenAI from 'openai';
