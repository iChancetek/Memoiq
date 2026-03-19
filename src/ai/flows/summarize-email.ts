
'use server';

/**
 * @fileOverview Summarizes an email.
 */

import { openai } from '@/ai/openai-client';
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
  const { from, subject, body } = input;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing emails concisely. Analyze the email and provide a one-paragraph summary and a list of key action items in JSON format."
        },
        {
          role: "user",
          content: `Email From: ${from}\nEmail Subject: ${subject}\nEmail Body:\n${body}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "No summary available.",
      actionItems: parsed.actionItems || []
    };
  } catch (error: any) {
    console.error('Error summarizing email:', error);
    return {
        summary: "Error generating summary.",
        actionItems: []
    };
  }
}
