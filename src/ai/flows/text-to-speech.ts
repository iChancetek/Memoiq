
'use server';
/**
 * @fileOverview Converts text to speech.
 *
 * - textToSpeech - Converts text to speech.
 * - TextToSpeechInput - The input type for the flow.
 * - TextToSpeechOutput - The return type for the flow.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  const { text } = input;
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return { audioDataUri };
  } catch (error: any) {
    console.error('TTS Error:', error);
    return { audioDataUri: "" };
  }
}
