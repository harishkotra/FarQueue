import Link from 'next/link';

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => (
  <div style={{ marginBottom: '25px' }}>
    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>{question}</h3>
    <p style={{ color: '#a0a0a0', lineHeight: '1.6' }}>{children}</p>
  </div>
);

export default function LegalPage() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', color: 'white' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>FarQueue Policies & FAQ</h1>
        <Link href="/" style={{ color: '#8a63d2', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' }}>
          &larr; Back to the App
        </Link>
      </header>

      {/* Terms of Service Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>Terms of Service</h2>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          Welcome to FarQueue! By using our application, you agree to these simple terms. Please read them carefully.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>1. The Service</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          FarQueue is a tool to help you schedule casts on the Farcaster protocol. We provide a free tier with a limit of 15 casts per month and a paid "Pro" tier for unlimited casts.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>2. Your Responsibility</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          You are responsible for the content you schedule. Do not use FarQueue to post spam, illegal content, or anything that violates Farcaster's community guidelines. We are a tool; you are the publisher.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>3. Payments</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          Upgrading to Pro is a one-time payment handled on the Base Sepolia testnet. All transactions are final and non-refundable. You are in control of your wallet and are responsible for approving the transaction.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>4. "As Is" Service</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          FarQueue is a hackathon project provided "as is," without any warranties. We will do our best to ensure casts are published on time, but we cannot guarantee 100% reliability.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>5. Issues & Support</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          If you encounter any bugs or have issues, please report them by creating an issue on our <a href="https://github.com/harishkotra/farqueue" target="_blank" rel="noopener noreferrer" style={{ color: '#8a63d2', textDecoration: 'underline' }}>GitHub repository</a>.
        </p>
      </section>

      {/* Privacy Policy Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>Privacy Policy</h2>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          We respect your privacy and aim to collect only the data necessary to provide our service.
        </p>
        <strong style={{ display: 'block', marginBottom: '10px' }}>What We Collect</strong>
        <ul style={{ color: '#a0a0a0', marginLeft: '20px', marginBottom: '20px', lineHeight: '1.6' }}>
          <li>Your public Farcaster profile information (FID, username, display name, PFP) via Neynar.</li>
          <li>Your primary verified wallet address to record on-chain activity.</li>
          <li>The content and scheduled time of the casts you queue.</li>
        </ul>
        <strong style={{ display: 'block', marginBottom: '10px' }}>How We Use It</strong>
        <ul style={{ color: '#a0a0a0', marginLeft: '20px', marginBottom: '20px', lineHeight: '1.6' }}>
          <li>To authenticate you and publish casts on your behalf using your approved signer.</li>
          <li>To enforce the 15-cast monthly limit for free users.</li>
          <li>To record your on-chain activity (first cast registration or Pro upgrade).</li>
        </ul>
        <strong style={{ display: 'block', marginBottom: '10px' }}>Data Sharing</strong>
        <p style={{ color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.6' }}>
          We do not sell or share your personal data with third parties. Your on-chain activity (Pro Pass NFT and registration event) is publicly visible on the blockchain, by design. The content of your casts is published to the public Farcaster protocol.
        </p>
      </section>

      {/* FAQ Section */}
      <section>
        <h2 style={{ fontSize: '2rem', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>Frequently Asked Questions (FAQ)</h2>
        
        <FAQItem question="What is FarQueue?">
          FarQueue is a tool that lets you schedule your Farcaster casts to be published at a future time. It also includes AI-powered features to help you write more engaging content.
        </FAQItem>

        <FAQItem question="How does the scheduling work?">
          When you schedule a cast, it's saved in our database. A secure, automated background process (a cron job) runs every minute to check for casts that are due. When the time comes, it uses the secure signer you approved during login to publish the cast to Farcaster on your behalf.
        </FAQItem>

        <FAQItem question="What is the 'Pro' tier and how much does it cost?">
          The free tier allows you to schedule 15 casts per month. The Pro tier gives you unlimited casts. It's a one-time upgrade that costs **0.01 ETH** on the **Base Sepolia testnet**.
        </FAQItem>
        
        <FAQItem question="What is the 'Pro Pass NFT'?">
          When you upgrade to Pro, our smart contract mints a unique "FarQueue Pro Pass" NFT to your wallet. This is your permanent, on-chain proof of membership. You can view it in a wallet explorer like Blockscout.
        </FAQItem>

        <FAQItem question="What does 'on-chain activity' mean for free users?">
          To demonstrate our web3 integration for everyone, we record your first scheduled cast as an on-chain event. Our smart contract emits a `UserRegistered` event with your FID and wallet address. This is a public, verifiable record of you joining the FarQueue community, and it costs you nothing.
        </FAQItem>

        <FAQItem question="Can I edit or delete a cast after I schedule it?">
          **Not yet.** This is the number one feature on our roadmap for after the hackathon. For now, please double-check your cast before scheduling.
        </FAQItem>

        <FAQItem question="Is the payment secure?">
          Yes. All payments are handled directly between your wallet and our smart contract on the Base Sepolia testnet. We never have access to your private keys.
        </FAQItem>

        <FAQItem question="My cast didn't publish on time. What happened?">
          While we aim for high reliability, this is a hackathon project. There might be occasional delays in our cron job. If your cast is significantly late, please check our <a href="https://github.com/harishkotra/farqueue/issues" target="_blank" rel="noopener noreferrer" style={{ color: '#8a63d2', textDecoration: 'underline' }}>GitHub Issues</a> to see if there are any known problems.
        </FAQItem>

      </section>
    </main>
  );
}