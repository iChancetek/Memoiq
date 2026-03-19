'use server';

import { openai } from '@/ai/openai-client';

export async function suggestionFlow(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error('Error in suggestionFlow:', error);
    return "Error generating suggestion.";
  }
}
