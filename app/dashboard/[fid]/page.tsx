import Link from 'next/link';
import { query } from '@/lib/db';

interface DashboardData {
  user: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    is_pro: boolean;
    pro_since: string | null;
    upgrade_tx_hash: string | null;
  };
  scheduledCasts: {
    id: number;
    cast_text: string;
    publish_at: string;
    is_published: boolean;
    published_hash: string | null;
  }[];
}

async function getDashboardData(fid: string): Promise<DashboardData | null> {
  try {
    const [userResult, castsResult] = await Promise.all([
      query('SELECT fid, username, display_name, pfp_url, is_pro, pro_since, upgrade_tx_hash FROM users WHERE fid = ?', [fid]),
      query('SELECT * FROM scheduled_casts WHERE user_fid = ? ORDER BY created_at DESC', [fid])
    ]);

    if (!userResult[0]) {
      return null;
    }

    return {
      user: userResult[0],
      scheduledCasts: castsResult
    };
  } catch (error) {
    console.error("Dashboard data fetching error:", error);
    return null;
  }
}

export default async function DashboardPage({ params }: { params: { fid: string } }) {
    const { fid } = await params;
    const data = await getDashboardData(fid);

    if (!data) {
        return (
            <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', textAlign: 'center', color: 'white' }}>
                <h1 style={{ fontSize: '2rem' }}>User Not Found</h1>
                <p style={{ color: '#a0a0a0' }}>The dashboard for this user could not be loaded.</p>
                <Link href="/" style={{ color: '#8a63d2', textDecoration: 'underline', marginTop: '20px', display: 'inline-block' }}>
                    &larr; Back to Scheduler
                </Link>
            </main>
        );
    }
    
    const { user, scheduledCasts } = data;

    return (
        <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px', color: 'white' }}>
            <header>
                <Link href="/" style={{ color: '#a0a0a0', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
                    &larr; Back to FarQueue
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src={user.pfp_url} alt="Profile Picture" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{user.display_name}</h1>
                        <p style={{ color: '#a0a0a0' }}>@{user.username} (FID: {user.fid})</p>
                    </div>
                </div>
            </header>

            <section style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Membership Status</h2>
                {user.is_pro ? (
                    <div>
                        <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.2rem' }}>Pro Member ✨</p>
                        <p style={{ color: '#a0a0a0', marginTop: '5px' }}>
                            Upgraded on: {new Date(user.pro_since!).toLocaleString()}
                        </p>
                        <div style={{ marginTop: '15px' }}>
                            <p>Your Pro Pass NFT Transaction:</p>
                            <a 
                                href={`https://base-sepolia.blockscout.com/tx/${user.upgrade_tx_hash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#8a63d2', textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                                {user.upgrade_tx_hash}
                            </a>
                        </div>
                    </div>
                ) : (
                    <p>Free Tier Member</p>
                )}
            </section>

            <section>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Cast Queue & History</h2>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {scheduledCasts.length > 0 ? (
                        scheduledCasts.map((cast) => (
                        <li key={cast.id} style={{ backgroundColor: '#111', border: '1px solid #333', padding: '15px', borderRadius: '8px' }}>
                            <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>"{cast.cast_text}"</p>
                            <small style={{ color: '#a0a0a0' }}>
                            Scheduled for: {new Date(cast.publish_at).toLocaleString()}
                            <br />
                            Status: <span style={{ fontWeight: 'bold', color: cast.is_published ? '#28a745' : '#ffc107' }}>
                                {cast.is_published ? `Published` : 'Pending'}
                            </span>
                            </small>
                        </li>
                        ))
                    ) : (
                        <p style={{ color: '#a0a0a0' }}>No casts scheduled or published yet.</p>
                    )}
                </ul>
            </section>
        </main>
    );
}