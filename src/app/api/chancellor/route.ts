import { NextRequest, NextResponse } from 'next/server';
import { chancellorChat } from '@/ai/flows/chancellor-chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, currentPage, userId, voiceResponse } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const result = await chancellorChat({ message, history: history || [], currentPage, userId, voiceResponse });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Chancellor API Error]', err);
    return NextResponse.json(
      { error: 'Chancellor encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}
