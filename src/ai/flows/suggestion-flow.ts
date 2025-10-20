'use server';

import { ai } from '@/ai/genkit';
import { gpt4o } from 'genkitx-openai';
import { z } from 'zod';

export const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt: string) => {
    const response = await ai.generate({
      model: gpt4o,
      prompt: prompt,
    });
    return response.text;
  }
);
