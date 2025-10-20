import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { User } from '@neynar/react/dist/types';

export async function POST(request: NextRequest) {
  try {
    const user: User = await request.json();

    if (!user || !user.fid || !user.signer_uuid) {
      return NextResponse.json({ message: 'Invalid user data provided.' }, { status: 400 });
    }

    await query(
      `INSERT INTO users (fid, signer_uuid, username, display_name, pfp_url)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         signer_uuid = VALUES(signer_uuid),
         username = VALUES(username),
         display_name = VALUES(display_name),
         pfp_url = VALUES(pfp_url)`,
      [user.fid, user.signer_uuid, user.username, user.display_name, user.pfp_url]
    );

    return NextResponse.json({ message: 'User saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ message: 'Failed to save user data.' }, { status: 500 });
  }
}