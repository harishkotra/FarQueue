import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';

interface ScheduleCastRequestBody {
  fid: number;
  castText: string;
  publishAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fid, castText, publishAt }: ScheduleCastRequestBody = await request.json();

    if (!fid || !castText || !publishAt) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const now = new Date();
    const scheduledDate = new Date(publishAt);

    // Create a date 5 minutes from now
    const minTime = new Date(now.getTime() + 5 * 60 * 1000);
    // Create a date 25 days from now
    const maxTime = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

    if (scheduledDate < minTime) {
      return NextResponse.json({ message: 'Scheduled time must be at least 5 minutes in the future.' }, { status: 400 });
    }

    if (scheduledDate > maxTime) {
      return NextResponse.json({ message: 'Scheduled time cannot be more than 25 days in the future.' }, { status: 400 });
    }

    await query(
      'INSERT INTO scheduled_casts (user_fid, cast_text, publish_at) VALUES (?, ?, ?)',
      [fid, castText, scheduledDate]
    );

    return NextResponse.json({ message: 'Cast scheduled successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ message: 'Failed to schedule cast.' }, { status: 500 });
  }
}