import {genkit} from 'genkit';
import {firebase} from '@genkit-ai/firebase';
import openAI from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({apiKey: process.env.OPENAI_API_KEY})
  ]
});
