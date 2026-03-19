
'use server';

/**
 * @fileOverview Generates a draft reply to an email.
 */

import { openai } from '@/ai/openai-client';
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
  const { from, subject, body, userContext } = input;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: "You are an expert at drafting professional and concise emails. Based on the original email and user context, draft a clear, professional, and helpful response. Do not include a subject line or signature. Return the result in JSON format with a 'replyBody' field."
        },
        {
          role: "user",
          content: `Original Email From: ${from}\nOriginal Email Subject: ${subject}\nOriginal Email Body:\n${body}\n\nUser Context for Reply: ${userContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);
    return {
      replyBody: parsed.replyBody || "Could not draft reply."
    };
  } catch (error: any) {
    console.error('Error drafting email reply:', error);
    return {
      replyBody: "Error generating draft reply."
    };
  }
}
