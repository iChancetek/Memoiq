'use server';
/**
 * @fileOverview Translates text to a specified language.
 *
 * - translateText - Translates text.
 * - TranslateTextInput - The input type for the flow.
 * - TranslateTextOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.enum(['en', 'es']).describe("The language to translate the text into."),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translatePrompt = ai.definePrompt({
    name: 'translateTextPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    prompt: `You are a translation expert. Translate the following text to {{targetLanguage}}.

Text:
{{{text}}}
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ text, targetLanguage }) => {
    let translationOutput;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        try {
            const result = await translatePrompt({ text, targetLanguage });
            translationOutput = result.output;
            break; // Success
        } catch (error: any) {
            attempts++;
            if (error.message.includes('503') && attempts < maxAttempts) {
                console.log(`Scribe translation attempt ${attempts} failed, retrying...`);
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            } else {
                throw error;
            }
        }
    }

    if (!translationOutput) {
        throw new Error('Translation failed after multiple attempts.');
    }
    
    return { translation: translationOutput.translation };
  }
);
