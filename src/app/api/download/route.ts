import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const filePath = join(process.cwd(), 'fire-monitoring-platform.tar.gz');
  
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
  
  const fileBuffer = readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/x-tar+gzip',
      'Content-Disposition': 'attachment; filename="fire-monitoring-platform.tar.gz"',
      'Content-Length': fileBuffer.length.toString(),
    },
  });
}
