import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ message: 'FID is required.' }, { status: 400 });
  }

  try {
    const [userResult] = await query('SELECT is_pro FROM users WHERE fid = ?', [fid]);
    const isPro = userResult?.is_pro || false;

    let castCount = 0;
    if (!isPro) {
      const [countResult] = await query(
        `SELECT COUNT(*) as castCount FROM scheduled_casts
         WHERE user_fid = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
        [fid]
      );
      castCount = countResult.castCount;
    }

    return NextResponse.json({ is_pro: isPro, monthly_cast_count: castCount }, { status: 200 });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ message: 'Failed to fetch user status.' }, { status: 500 });
  }
}