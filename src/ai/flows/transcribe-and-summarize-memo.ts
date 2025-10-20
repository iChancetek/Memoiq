
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
import { gpt4o, whisper1 } from 'genkitx-openai';

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

const summarizeMemoPrompt = ai.definePrompt({
  name: 'summarizeMemoPrompt',
  input: {schema: z.object({transcription: z.string()})},
  output: {schema: z.object({summary: z.string()})},
  model: gpt4o,
  prompt: `You are a summarization expert. Please summarize the following text to its key points.\\n\\nText: {{{transcription}}}`,
});

const transcribeAndSummarizeMemoFlow = ai.defineFlow(
  {
    name: 'transcribeAndSummarizeMemoFlow',
    inputSchema: TranscribeAndSummarizeMemoInputSchema,
    outputSchema: TranscribeAndSummarizeMemoOutputSchema,
  },
  async ({ audioDataUri }) => {
    // Directly call the whisper model for transcription.
    const transcriptionResult = await ai.generate({
      model: whisper1,
      prompt: [
        { text: `Transcribe the following audio.` },
        { media: { url: audioDataUri } }
      ],
    });

    const transcription = transcriptionResult.text;
    if (!transcription) {
      throw new Error("Transcription failed to produce text.");
    }
    
    // Use the transcription to get a summary.
    const summaryResult = await summarizeMemoPrompt({transcription});
    const summary = summaryResult.output!.summary;

    return {transcription, summary};
  }
);
