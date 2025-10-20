
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
import { gpt4o } from 'genkitx-openai';

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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    // Decode the data URI to get the raw audio data
    const parts = audioDataUri.match(/^data:(.*);base64,(.*)$/);
    if (!parts) {
      throw new Error('Invalid data URI format');
    }
    const mimeType = parts[1];
    const base64Data = parts[2];
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    // Create FormData to send to OpenAI API
    const formData = new FormData();
    // Use a generic but valid filename. The extension helps Whisper.
    formData.append("file", audioBlob, "recording.webm"); 
    formData.append("model", "whisper-1");

    // Direct call to OpenAI Whisper API
    let transcription = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorBody = await response.json();
          console.error("OpenAI API Error:", errorBody);
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const result = await response.json();
        transcription = result.text;
        break; // Success
        
      } catch (error: any) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Transcription attempt ${attempts} failed, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          console.error('Transcription failed after multiple attempts:', error);
          throw new Error('Transcription failed after multiple attempts.');
        }
      }
    }
    
    if (!transcription) {
      throw new Error("Transcription failed to produce text.");
    }
    
    // Use the transcription to get a summary via a separate Genkit prompt.
    const summaryResult = await summarizeMemoPrompt({transcription});
    const summary = summaryResult.output!.summary;

    return {transcription, summary};
  }
);
