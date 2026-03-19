
'use server';
/**
 * @fileOverview A voice memo transcription and summarization AI agent.
 *
 * - transcribeAndSummarizeMemo - A function that handles the memo transcription and summarization process.
 * - TranscribeAndSummarizeMemoInput - The input type for the transcribeAndSummarizeMemo function.
 * - TranscribeAndSummarizeMemoOutput - The return type for the transcribeAndSummarizeMemo function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const TranscribeAndSummarizeMemoInputSchema = z.object({
  audioDataUri: z.string().describe("A voice memo audio file as a data URI."),
});
export type TranscribeAndSummarizeMemoInput = z.infer<typeof TranscribeAndSummarizeMemoInputSchema>;

const TranscribeAndSummarizeMemoOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the voice memo.'),
  summary: z.string().describe('The summary of the voice memo.'),
});
export type TranscribeAndSummarizeMemoOutput = z.infer<typeof TranscribeAndSummarizeMemoOutputSchema>;

export async function transcribeAndSummarizeMemo(input: TranscribeAndSummarizeMemoInput): Promise<TranscribeAndSummarizeMemoOutput> {
  const { audioDataUri } = input;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  // 1. Transcription (Whisper)
  const parts = audioDataUri.match(/^data:(.*);base64,(.*)$/);
  if (!parts) {
      throw new Error('Invalid data URI format');
  }
  const mimeType = parts[1];
  const base64Data = parts[2];
  const audioBuffer = Buffer.from(base64Data, 'base64');
  const audioBlob = new Blob([audioBuffer], { type: mimeType });

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm"); 
  formData.append("model", "whisper-1");

  let transcription = '';
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
      console.error("OpenAI Whisper API Error:", errorBody);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    transcription = result.text;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }

  if (!transcription) {
    throw new Error("Transcription failed to produce text.");
  }

  // 2. Summarize (GPT-4o)
  let summary = '';
  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: "You are a summarization expert. Please summarize the following text to its key points." },
        { role: "user", content: `Text: ${transcription}` }
      ]
    });
    summary = summaryResponse.choices[0].message.content || "";
  } catch (error) {
    console.warn('Summary generation failed:', error);
    summary = "Unable to generate summary.";
  }

  return { transcription, summary };
}
