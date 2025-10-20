
'use server';
/**
 * @fileOverview Converts text to speech.
 *
 * - textToSpeech - Converts text to speech.
 * - TextToSpeechInput - The input type for the flow.
 * - TextToSpeechOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { tts1 } from 'genkitx-openai';

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
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text }) => {
    let media;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const ttsResponse = await ai.generate({
                model: tts1,
                prompt: text,
                config: {
                    voice: 'nova'
                }
            });
            media = ttsResponse.media;
            break; // Success
        } catch(error: any) {
            attempts++;
            if (error.message && (error.message.includes('503') || error.message.includes('429')) && attempts < maxAttempts) {
                console.log(`TTS generation attempt ${attempts} failed, retrying...`);
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            } else {
                throw error;
            }
        }
    }


    if (!media) {
      throw new Error('no media returned');
    }

    return {
      audioDataUri: media.url,
    };
  }
);
