"use client";
import Link from 'next/link';

export function Footer() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL;
  const builderUrl = process.env.NEXT_PUBLIC_BUILDER_GITHUB_URL;
  const builderName = process.env.NEXT_PUBLIC_BUILDER_NAME;

  return (
    <footer style={{
      width: '100%',
      padding: '20px 40px',
      marginTop: 'auto',
      backgroundColor: '#050505',
      borderTop: '1px solid #333',
      color: '#a0a0a0',
      fontSize: '0.675rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <p>
            Built by <a href="https://farcaster.xyz/harishk" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Harish Kotra</a>
            {' | '}
            <a href="https://github.com/harishkotra/farqueue" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>View on GitHub</a>
            {' | '}
            <Link href="/legal" style={{ color: 'white', textDecoration: 'underline' }}>
              Terms & FAQ
            </Link>
          </p>
        </div>
        {contractAddress && (
          <div style={{ wordBreak: 'break-all' }}>
            <p>On-chain Registry (Base Sepolia):</p>
            <a 
              href={`https://base-sepolia.blockscout.com/address/${contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'white', textDecoration: 'underline' }}
            >
              {contractAddress}
            </a>
          </div>
        )}
        <div>
          <p>Powered by <a href="https://neynar.com" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Neynar</a> and <a href="https://farcaster.xyz" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Farcaster</a>.</p>
        </div>
      </div>
    </footer>
  );
}