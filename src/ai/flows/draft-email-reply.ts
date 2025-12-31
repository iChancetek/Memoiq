
'use server';

/**
 * @fileOverview Generates a draft reply to an email.
 */

import { ai } from '@/ai/genkit';
import { gpt4o } from 'genkitx-openai';
import { z } from 'zod';

const DraftEmailReplyInputSchema = z.object({
  from: z.string().describe("The sender of the original email."),
  subject: z.string().describe("The subject of the original email."),
  body: z.string().describe("The body content of the original email."),
  userContext: z.string().describe("Optional context about the user's intent or relationship with the sender."),
});
export type DraftEmailReplyInput = z.infer<typeof DraftEmailReplyInputSchema>;

const DraftEmailReplyOutputSchema = z.object({
  replyBody: z.string().describe('The drafted reply email body.'),
});
export type DraftEmailReplyOutput = z.infer<typeof DraftEmailReplyOutputSchema>;

export async function draftEmailReply(
  input: DraftEmailReplyInput
): Promise<DraftEmailReplyOutput> {
  return draftEmailReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftEmailReplyPrompt',
  input: { schema: DraftEmailReplyInputSchema },
  output: { schema: DraftEmailReplyOutputSchema },
  model: gpt4o,
  prompt: `You are an expert at drafting professional and concise emails. Based on the original email below, draft a reply.

Original Email From: {{{from}}}
Original Email Subject: {{{subject}}}
Original Email Body:
{{{body}}}

User Context for Reply: {{{userContext}}}

Instructions:
1. Analyze the original email to understand its purpose and key points.
2. Consider the user's context to tailor the tone and content of the reply.
3. Draft a clear, professional, and helpful response. Do not include a subject line or signature.

Drafted Reply:`,
});

const draftEmailReplyFlow = ai.defineFlow(
  {
    name: 'draftEmailReplyFlow',
    inputSchema: DraftEmailReplyInputSchema,
    outputSchema: DraftEmailReplyOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    return result.output!;
  }
);
