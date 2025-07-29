'use server';
/**
 * @fileOverview A voice memo transcription and summarization AI agent.
 *
 * - transcribeAndSummarizeMemo - A function that handles the memo transcription and summarization process.
 * - TranscribeAndSummarizeMemoInput - The input type for the transcribeAndSummarizeMemo function.
 * - TranscribeAndSummarizeMemoOutput - The return type for the transcribeAndSummarizeMemo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAndSummarizeMemoInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A voice memo audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAndSummarizeMemoInput = z.infer<typeof TranscribeAndSummarizeMemoInputSchema>;

const TranscribeAndSummarizeMemoOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the voice memo.'),
  summary: z.string().describe('The summary of the voice memo.'),
});
export type TranscribeAndSummarizeMemoOutput = z.infer<typeof TranscribeAndSummarizeMemoOutputSchema>;

export async function transcribeAndSummarizeMemo(input: TranscribeAndSummarizeMemoInput): Promise<TranscribeAndSummarizeMemoOutput> {
  return transcribeAndSummarizeMemoFlow(input);
}

const transcribeMemoPrompt = ai.definePrompt({
  name: 'transcribeMemoPrompt',
  input: {schema: TranscribeAndSummarizeMemoInputSchema},
  output: {schema: z.object({transcription: z.string()})},
  prompt: `You are a transcription expert. Please transcribe the following audio memo to text.\n\nAudio: {{media url=audioDataUri}}`,
});

const summarizeMemoPrompt = ai.definePrompt({
  name: 'summarizeMemoPrompt',
  input: {schema: z.object({transcription: z.string()})},
  output: {schema: z.object({summary: z.string()})},
  prompt: `You are a summarization expert. Please summarize the following text to its key points.\n\nText: {{{transcription}}}`,
});

const transcribeAndSummarizeMemoFlow = ai.defineFlow(
  {
    name: 'transcribeAndSummarizeMemoFlow',
    inputSchema: TranscribeAndSummarizeMemoInputSchema,
    outputSchema: TranscribeAndSummarizeMemoOutputSchema,
  },
  async input => {
    const {output: transcriptionOutput} = await transcribeMemoPrompt(input);
    const transcription = transcriptionOutput!.transcription;

    const {output: summaryOutput} = await summarizeMemoPrompt({transcription});
    const summary = summaryOutput!.summary;

    return {transcription, summary};
  }
);
