'use server';
/**
 * @fileOverview Generates empathetic responses for the AI Companion, iSkylar.
 *
 * - getCompanionResponse - A function that creates a conversational response from iSkylar.
 * - GetCompanionResponseInput - The input type for the getCompanionResponse function.
 * - GetCompanionResponseOutput - The return type for the getCompanionResponse function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';
import { getServerFirebase } from '@/firebase/server';

const { firestore: db } = getServerFirebase();

const GetCompanionResponseInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).describe('The conversation history, including the latest user message.'),
});
export type GetCompanionResponseInput = z.infer<typeof GetCompanionResponseInputSchema>;

const GetCompanionResponseOutputSchema = z.object({
  text: z.string().describe('The text response from iSkylar.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI.'),
});
export type GetCompanionResponseOutput = z.infer<typeof GetCompanionResponseOutputSchema>;

export async function getCompanionResponse(
  input: GetCompanionResponseInput
): Promise<GetCompanionResponseOutput> {
  const { history } = input;

  try {
    // 1. Generate Response Text
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: "You are iSkylar, a friendly and empathetic AI Companion. Your purpose is to be a kind, emotionally aware voice that listens, supports, and guides users. Tone: warm, thoughtful, intelligent, respectful. Never be robotic. Engage users on self-care, wellness, fitness, mindfulness."
        },
        ...history.map(m => ({
          role: m.role,
          content: m.content
        }))
      ]
    });

    const responseText = response.choices[0].message.content || "I'm here for you.";

    // 2. Generate TTS Audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: responseText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return {
      text: responseText,
      audioDataUri,
    };
  } catch (error: any) {
    console.error('Error in getCompanionResponse:', error);
    return {
      text: "I'm sorry, I'm having trouble connecting right now.",
      audioDataUri: "",
    };
  }
}
