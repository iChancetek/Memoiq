'use server';
/**
 * @fileOverview Transcribes audio recordings.
 *
 * - scribeTranscribe - Transcribes audio.
 * - ScribeInput - The input type for the flow.
 * - ScribeOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScribeInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'An audio file, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type ScribeInput = z.infer<typeof ScribeInputSchema>;

const ScribeOutputSchema = z.object({
  transcription: z.string().describe('The original transcription of the audio.'),
});
export type ScribeOutput = z.infer<typeof ScribeOutputSchema>;

export async function scribeTranscribe(
  input: ScribeInput
): Promise<ScribeOutput> {
  return scribeTranscribeFlow(input);
}

const transcribePrompt = ai.definePrompt({
    name: 'scribeTranscribePrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: ScribeInputSchema },
    output: { schema: ScribeOutputSchema },
    prompt: `You are a transcription expert for English. Please transcribe the following audio to text in its original language.\n\nAudio: {{media url=audioDataUri}}`,
});


const scribeTranscribeFlow = ai.defineFlow(
  {
    name: 'scribeTranscribeFlow',
    inputSchema: ScribeInputSchema,
    outputSchema: ScribeOutputSchema,
  },
  async ({ audioDataUri }) => {
    let transcriptionOutput;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const result = await transcribePrompt({ audioDataUri });
            transcriptionOutput = result.output;
            break; // Success
        } catch (error: any) {
            attempts++;
            if (error.message.includes('503') && attempts < maxAttempts) {
                console.log(`Scribe transcription attempt ${attempts} failed, retrying...`);
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            } else {
                throw error;
            }
        }
    }

    if (!transcriptionOutput) {
        throw new Error('Transcription failed after multiple attempts.');
    }
    
    return { transcription: transcriptionOutput.transcription };
  }
);
