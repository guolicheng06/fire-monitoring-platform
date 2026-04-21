import { NextResponse } from 'next/server';
import { alarmOps } from '@/lib/db-operations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, resolvedBy, resolution } = body;
    
    if (!id || !resolvedBy || !resolution) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const alarm = await alarmOps.resolve(id, resolvedBy, resolution);
    return NextResponse.json(alarm);
  } catch (error) {
    console.error('Failed to resolve alarm:', error);
    return NextResponse.json({ error: 'Failed to resolve alarm' }, { status: 500 });
  }
}
