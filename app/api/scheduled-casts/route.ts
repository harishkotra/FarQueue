import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ message: 'FID is required.' }, { status: 400 });
  }

  try {
    const casts = await query(
      'SELECT * FROM scheduled_casts WHERE user_fid = ? ORDER BY publish_at DESC',
      [fid]
    );
    return NextResponse.json({ casts }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ message: 'Failed to fetch scheduled casts.' }, { status: 500 });
  }
}