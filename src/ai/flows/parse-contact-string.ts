
'use server';
/**
 * @fileOverview Parses a natural language string into a structured contact object.
 *
 * - parseContactString - A function that handles parsing a string into a contact.
 * - ParseContactStringInput - The input type for the parseContactString function.
 * - ParseContactStringOutput - The return type for the parseContactString function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const ParseContactStringInputSchema = z.object({
  contactString: z.string().describe('The natural language description of the contact.'),
});
export type ParseContactStringInput = z.infer<typeof ParseContactStringInputSchema>;

const ParseContactStringOutputSchema = z.object({
  name: z.string().describe('The full name of the contact.'),
  email: z.string().describe('The email address of the contact. Can be an empty string if not mentioned.'),
  title: z.string().describe('The job title of the contact. Can be an empty string if not mentioned.'),
  company: z.string().describe('The company the contact works for. Can be an empty string if not mentioned.'),
  notes: z.string().describe('Any additional notes or details mentioned. Can be an empty string.'),
});
export type ParseContactStringOutput = z.infer<typeof ParseContactStringOutputSchema>;

export async function parseContactString(
  input: ParseContactStringInput
): Promise<ParseContactStringOutput> {
  const { contactString } = input;

  const prompt = `You are an expert at parsing contact information from natural language. Analyze the user's request and convert it into a structured contact object.

User Request: "${contactString}"

Instructions:
1.  Extract the full name of the person.
2.  Extract the email address. If not provided, leave the field empty.
3.  Extract the job title. If not provided, leave the field empty.
4.  Extract the company name. If not provided, leave the field empty.
5.  Extract any other relevant information as notes.

Output MUST be a JSON object with the following fields:
- name (string)
- email (string)
- title (string)
- company (string)
- notes (string)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    return ParseContactStringOutputSchema.parse(result);

  } catch (error: any) {
    console.error('Error in parseContactString:', error);
    return {
        name: contactString,
        email: "",
        title: "",
        company: "",
        notes: ""
    };
  }
}
