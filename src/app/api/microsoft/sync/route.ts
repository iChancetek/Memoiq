import { NextRequest, NextResponse } from 'next/server';
import { syncMicrosoftAccount } from '@/services/microsoft-sync';

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }
    const result = await syncMicrosoftAccount(userId, email);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Microsoft Sync Error]', err);
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
