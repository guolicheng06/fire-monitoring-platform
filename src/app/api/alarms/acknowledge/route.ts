import { NextResponse } from 'next/server';
import { alarmOps } from '@/lib/db-operations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, acknowledgedBy } = body;
    
    if (!id || !acknowledgedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const alarm = await alarmOps.acknowledge(id, acknowledgedBy);
    return NextResponse.json(alarm);
  } catch (error) {
    console.error('Failed to acknowledge alarm:', error);
    return NextResponse.json({ error: 'Failed to acknowledge alarm' }, { status: 500 });
  }
}
