'use server';
/**
 * @fileOverview Transcribes and translates audio recordings.
 *
 * - scribeTranscribeAndTranslate - Transcribes audio and optionally translates it.
 * - ScribeInput - The input type for the flow.
 * - ScribeOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScribeInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  targetLanguage: z.enum(['en', 'es']).describe("The language to translate the transcription into."),
});
export type ScribeInput = z.infer<typeof ScribeInputSchema>;

const ScribeOutputSchema = z.object({
  transcription: z.string().describe('The original transcription of the audio.'),
  translation: z.string().describe('The translated text.'),
});
export type ScribeOutput = z.infer<typeof ScribeOutputSchema>;

export async function scribeTranscribeAndTranslate(
  input: ScribeInput
): Promise<ScribeOutput> {
  return scribeFlow(input);
}

const transcribePrompt = ai.definePrompt({
    name: 'scribeTranscribePrompt',
    input: { schema: z.object({ audioDataUri: z.string() }) },
    output: { schema: z.object({ transcription: z.string() }) },
    prompt: `You are a transcription expert for English and Spanish. Please transcribe the following audio to text in its original language.\n\nAudio: {{media url=audioDataUri}}`,
});

const translatePrompt = ai.definePrompt({
    name: 'scribeTranslatePrompt',
    input: { schema: z.object({ text: z.string(), targetLanguage: z.string() }) },
    output: { schema: z.object({ translation: z.string() }) },
    prompt: `You are a translation expert. Translate the following text to {{targetLanguage}}.

Text:
{{{text}}}
`,
});

const scribeFlow = ai.defineFlow(
  {
    name: 'scribeFlow',
    inputSchema: ScribeInputSchema,
    outputSchema: ScribeOutputSchema,
  },
  async ({ audioDataUri, targetLanguage }) => {
    // Step 1: Transcribe the audio
    const { output: transcriptionOutput } = await transcribePrompt({ audioDataUri });
    if (!transcriptionOutput) {
        throw new Error('Transcription failed.');
    }
    const transcription = transcriptionOutput.transcription;

    // Step 2: Translate the transcription
    const { output: translationOutput } = await translatePrompt({ text: transcription, targetLanguage });
    if (!translationOutput) {
        throw new Error('Translation failed.');
    }
    const translation = translationOutput.translation;
    
    return { transcription, translation };
  }
);
