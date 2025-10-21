import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json({ message: 'User FID is required.' }, { status: 400 });
    }

    // Mark the user as a pro member in the database
    await query('UPDATE users SET is_pro = TRUE WHERE fid = ?', [fid]);

    return NextResponse.json({ message: 'Upgrade successful! You now have unlimited casts.' }, { status: 200 });
  } catch (error) {
    console.error('Upgrade Error:', error);
    return NextResponse.json({ message: 'Failed to upgrade account.' }, { status: 500 });
  }
}