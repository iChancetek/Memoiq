
'use server';
/**
 * @fileOverview Transcribes audio recordings using a direct API call to OpenAI Whisper.
 *
 * - scribeTranscribe - Transcribes audio.
 * - ScribeInput - The input type for the flow.
 * - ScribeOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScribeInputSchema = z.object({
  // We no longer use a data URI, but we'll receive the blob as a Buffer on the server
  audioBlobBuffer: z.any().describe('The audio file blob as a Buffer.'),
  mimeType: z.string().describe('The MIME type of the audio blob, e.g., "audio/webm".')
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

// This flow now bypasses Genkit's `ai.generate` for Whisper and calls the API directly.
const scribeTranscribeFlow = ai.defineFlow(
  {
    name: 'scribeTranscribeFlow',
    inputSchema: ScribeInputSchema,
    outputSchema: ScribeOutputSchema,
  },
  async ({ audioBlobBuffer, mimeType }) => {
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    const formData = new FormData();
    // Convert the plain object buffer back to a real Buffer
    const audioBuffer = Buffer.from(audioBlobBuffer.data);
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-1");

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
          console.log(`Scribe transcription attempt ${attempts} failed, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          console.error('Transcription failed after multiple attempts:', error);
          throw new Error('Transcription failed after multiple attempts.');
        }
      }
    }
    
    return { transcription };
  }
);
