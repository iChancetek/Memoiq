import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import openAI from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
    openAI({apiKey: process.env.OPENAI_API_KEY}),
  ],
});
