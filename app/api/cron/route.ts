import { NextResponse, NextRequest } from 'next/server';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import * as mysql from 'mysql2/promise';

// Define a type for the data we expect from the database
interface DueCast {
  id: number;
  cast_text: string;
  signer_uuid: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.NEYNAR_API_KEY) {
    return NextResponse.json({ message: 'Neynar API key not set.' }, { status: 500 });
  }
  const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
  const neynarClient = new NeynarAPIClient(config);

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    const now = new Date();

    const [dueCasts] = await connection.execute<DueCast[]>(
        `SELECT sc.id, sc.cast_text, u.signer_uuid
         FROM scheduled_casts sc
         JOIN users u ON sc.user_fid = u.fid
         WHERE sc.is_published = FALSE AND sc.publish_at <= ?`,
        [now]
    );

    if (dueCasts.length === 0) {
      return NextResponse.json({ message: 'No casts to publish.' }, { status: 200 });
    }

    let publishedCount = 0;
    for (const cast of dueCasts) {
      try {
        const result = await neynarClient.publishCast({ signerUuid: cast.signer_uuid, text: cast.cast_text });
        await connection.execute(
            'UPDATE scheduled_casts SET is_published = TRUE, published_hash = ? WHERE id = ?',
            [result.cast.hash, cast.id]
        );
        publishedCount++;
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Failed to publish cast ${cast.id}:`, error.message);
        } else {
          console.error(`Failed to publish cast ${cast.id}:`, 'An unknown error occurred');
        }
      }
    }
    return NextResponse.json({ message: `Successfully published ${publishedCount} of ${dueCasts.length} due casts.` }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Cron job failed:', errorMessage);
    return NextResponse.json({ message: `Cron job failed: ${errorMessage}` }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}