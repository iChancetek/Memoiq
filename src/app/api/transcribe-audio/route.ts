import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Readable } from 'stream';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { audioDataUri } = await req.json();

    if (!audioDataUri || typeof audioDataUri !== 'string') {
      return NextResponse.json({ error: 'audioDataUri is required.' }, { status: 400 });
    }

    // Strip the data URI header, e.g. "data:audio/webm;base64,..."
    const base64Data = audioDataUri.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid audio data URI.' }, { status: 400 });
    }

    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Build a File object from the buffer (Whisper needs a file-like object)
    const audioFile = new File([audioBuffer], 'recording.webm', { type: 'audio/webm' });

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: any) {
    console.error('[Transcribe Audio Error]', err);
    return NextResponse.json(
      { error: 'Audio transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}
