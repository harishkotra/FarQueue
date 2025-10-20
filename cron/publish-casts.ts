// cron/publish-casts.ts
import cron from 'node-cron';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import * as mysql from 'mysql2/promise';

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set in environment variables.");
}
const config = new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
});
const neynarClient = new NeynarAPIClient(config);

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

interface DueCast {
    id: number;
    cast_text: string;
    signer_uuid: string;
}

async function publishDueCasts() {
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
            console.log('No casts to publish at this time.');
            return;
        }

        console.log(`Found ${dueCasts.length} casts to publish.`);

        for (const cast of dueCasts) {
            try {
                const result = await neynarClient.publishCast({
                    signerUuid: cast.signer_uuid,
                    text: cast.cast_text
                });

                await connection.execute(
                    'UPDATE scheduled_casts SET is_published = TRUE, published_hash = ? WHERE id = ?',
                    [result.cast.hash, cast.id]
                );
                console.log(`Successfully published cast ${cast.id} with hash ${result.cast.hash}`);
            } catch (error: any) {
                console.error(`Failed to publish cast ${cast.id}:`, error.message);
            }
        }
    } catch (error: any) {
        console.error('Error in cron job:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

cron.schedule('* * * * *', publishDueCasts);

console.log('Cron job for publishing casts has been started.');