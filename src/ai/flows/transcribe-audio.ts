
'use server';
/**
 * @fileOverview A voice transcription AI agent.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { whisper1 } from 'genkitx-openai';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    language: z.enum(['en', 'es']).describe("The language of the audio to transcribe into."),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioPrompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: {schema: TranscribeAudioInputSchema},
  output: {schema: TranscribeAudioOutputSchema},
  model: whisper1,
  prompt: [
    { text: `You are a transcription expert. Please transcribe the following audio to text in {{language}}.` },
    { media: { url: '{{audioDataUri}}' } }
  ],
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    let output;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const result = await transcribeAudioPrompt(input);
            output = result.output;
            if (output) {
                break; 
            }
            attempts++;
        } catch (error: any) {
            attempts++;
            if ((error.message.includes('503') || error.message.includes('429')) && attempts < maxAttempts) {
                console.log(`Scribe transcription attempt ${attempts} failed, retrying...`);
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            } else {
                throw error;
            }
        }
    }
    
    if (!output) {
        throw new Error('Transcription failed after multiple attempts.');
    }
    return output;
  }
);
