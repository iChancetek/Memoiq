
'use server';

/**
 * @fileOverview Summarizes an email.
 */

import { ai } from '@/ai/genkit';
import { gpt4o } from 'genkitx-openai';
import { z } from 'zod';

const SummarizeEmailInputSchema = z.object({
  from: z.string().describe("The sender of the email."),
  subject: z.string().describe("The subject of the email."),
  body: z.string().describe("The content of the email to be summarized."),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe('A concise, one-paragraph summary of the email.'),
  actionItems: z.array(z.string()).describe('A list of potential action items or questions from the email.'),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

export async function summarizeEmail(
  input: SummarizeEmailInput
): Promise<SummarizeEmailOutput> {
  return summarizeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmailPrompt',
  input: { schema: SummarizeEmailInputSchema },
  output: { schema: SummarizeEmailOutputSchema },
  model: gpt4o,
  prompt: `You are an expert at summarizing emails concisely. Analyze the following email and provide a one-paragraph summary and a list of key action items.

Email From: {{{from}}}
Email Subject: {{{subject}}}
Email Body:
{{{body}}}

Instructions:
1.  **Summary**: Write a single paragraph that captures the main points and purpose of the email.
2.  **Action Items**: Identify any explicit or implicit tasks, questions, or deadlines for the recipient. List them out. If there are no action items, return an empty array.

Generate the structured output.`,
});

const summarizeEmailFlow = ai.defineFlow(
  {
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    return result.output!;
  }
);
