import { NextRequest, NextResponse } from 'next/server';
import { getMicrosoftAuthUrl } from '@/services/microsoft-oauth';

// Returns the Microsoft OAuth authorization URL for a given user (state = userId)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get('state');
  if (!state) {
    return NextResponse.json({ error: 'state (userId) is required' }, { status: 400 });
  }
  const url = getMicrosoftAuthUrl(state);
  return NextResponse.json({ url });
}
