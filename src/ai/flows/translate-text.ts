
'use server';
/**
 * @fileOverview Translates text to a specified language.
 *
 * - translateText - Translates text.
 * - TranslateTextInput - The input type for the flow.
 * - TranslateTextOutput - The return type for the flow.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

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
  const { text, targetLanguage } = input;

  const prompt = `You are a translation expert. Translate the following text to ${targetLanguage}.

Text:
${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });

    const translation = response.choices[0].message.content || "";
    
    return { translation };

  } catch (error: any) {
    console.error('Error in translateText:', error);
    return { translation: "Error during translation." };
  }
}
