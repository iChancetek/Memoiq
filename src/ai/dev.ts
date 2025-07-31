'use server';

// IMPORTANT: The dev entry point must be the first import.
import '@/ai/genkit'; // This will initialize genkit with the environment variables

// The Genkit dev server will automatically discover and load the flows from this directory.
// There is no need to explicitly import them here.
