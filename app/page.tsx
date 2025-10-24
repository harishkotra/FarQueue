// app/page.tsx
"use client";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { User } from "@neynar/react/dist/types";
import { useEffect, useState, useCallback, FormEvent } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import { injected } from '@wagmi/connectors';

// --- x402 Client-Side Helper ---
const EIP712Domain = { name: "x402", version: "1" };
const EIP712Types = {
  Payment: [
    { name: "amount", type: "uint256" }, { name: "asset", type: "address" },
    { name: "recipient", type: "address" }, { name: "nonce", type: "uint256" },
  ],
};

async function createPaymentToken(paymentRequirements: any, walletClient: any): Promise<string> {
  const { payment: paymentMessage } = paymentRequirements.paymentPayload;
  const signature = await walletClient.signTypedData({
    domain: EIP712Domain, types: EIP712Types, primaryType: 'Payment',
    message: {
      amount: BigInt(paymentMessage.amount),
      asset: paymentMessage.asset as `0x${string}`,
      recipient: paymentMessage.recipient as `0x${string}`,
      nonce: BigInt(paymentMessage.nonce),
    },
  });
  const tokenPayload = { paymentPayload: paymentRequirements.paymentPayload, signature };
  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
}

// --- Interfaces and Helper Functions ---
interface ScheduledCast { id: number; cast_text: string; publish_at: string; is_published: boolean; published_hash: string | null; }
interface UserStatus { is_pro: boolean; monthly_cast_count: number; }
const toDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Home() {
  const { user, isAuthenticated } = useNeynarContext();
  const [castText, setCastText] = useState<string>("");
  const [publishAt, setPublishAt] = useState<string>("");
  const [scheduledCasts, setScheduledCasts] = useState<ScheduledCast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect } = useConnect();
  
  // All the logic hooks remain the same, they are correct.
  useEffect(() => {
    const now = new Date();
    const min = new Date(now.getTime() + 5 * 60 * 1000);
    const max = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
    setMinDate(toDateTimeLocal(min));
    setMaxDate(toDateTimeLocal(max));
  }, []);

  useEffect(() => {
    if (user && user.fid) {
      const saveUserToDatabase = async (userData: User) => { try { await fetch('/api/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) }); } catch (error) { console.error("Failed to save user:", error); } };
      const fetchUserData = async () => { setIsLoading(true); try { const [castsResponse, statusResponse] = await Promise.all([fetch(`/api/scheduled-casts?fid=${user.fid}`), fetch(`/api/user-status?fid=${user.fid}`)]); if (castsResponse.ok) { const castsData = await castsResponse.json(); if (Array.isArray(castsData.casts)) { setScheduledCasts(castsData.casts); } } else { console.error("API call to fetch casts failed"); } if (statusResponse.ok) { const statusData = await statusResponse.json(); setUserStatus(statusData); } else { console.error("API call to fetch user status failed"); } } catch (error) { console.error("Failed to fetch user data:", error); } finally { setIsLoading(false); } };
      saveUserToDatabase(user);
      fetchUserData();
    } else { setScheduledCasts([]); setUserStatus(null); }
  }, [user]);

  const handleScheduleCast = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!castText || !publishAt || !user) {
      alert("Please fill in all fields.");
      return;
    }
    const utcPublishAt = new Date(publishAt).toISOString();
    try {
      const response = await fetch('/api/schedule-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: user.fid, castText, publishAt: utcPublishAt }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Cast scheduled successfully!");
        setCastText("");
        setPublishAt("");
        if (data.txHash) {
          setLastTxHash(data.txHash); // Set the transaction hash
        }
        // Manually trigger a refresh after scheduling
        if (user) {
          const castsResponse = await fetch(`/api/scheduled-casts?fid=${user.fid}`);
          const castsData = await castsResponse.json();
          setScheduledCasts(castsData.casts);
          
          const statusResponse = await fetch(`/api/user-status?fid=${user.fid}`);
          const statusData = await statusResponse.json();
          setUserStatus(statusData);
        }
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
            alert(errorData.message);
        } else {
            throw new Error(errorData.message || 'Failed to schedule cast.');
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setIsUpgrading(true);
    try {
      let walletClient = await getWalletClient(config);
      
      // If no wallet is connected, try to connect
      if (!walletClient) {
        alert("Please connect your wallet in the popup.");
        try {
          // Try to connect using the injected connector (MetaMask or similar)
          const { injected } = await import('@wagmi/connectors');
          await connectAsync({ connector: injected() });
          walletClient = await getWalletClient(config);
        } catch (connectError) {
          console.error("Wallet connection error:", connectError);
          throw new Error("Failed to connect wallet. Please make sure you have MetaMask or another Ethereum wallet installed and unlocked in your browser.");
        }
      }
      
      // Check if we successfully got a wallet client
      if (!walletClient) {
        throw new Error("Wallet connection failed. Please try again.");
      }
      
      const initialResponse = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: user.fid })
      });
      
      if (initialResponse.status === 402) {
        const responseBody = await initialResponse.json();
        console.log("Payment requirements response:", responseBody);
        // Fix: Extract payment requirements from the 'accepts' array
        const paymentRequirements = responseBody.accepts?.[0]; // Get the first payment option
        if (!paymentRequirements) {
            throw new Error("Payment requirements not found in the server response.");
        }
        
        console.log("Extracted payment requirements:", paymentRequirements);
        alert("Please confirm the transaction in your wallet to complete the upgrade.");
        
        const paymentToken = await createPaymentToken(paymentRequirements, walletClient);
        console.log("Created payment token:", paymentToken);
        
        const finalResponse = await fetch('/api/upgrade', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'X-PAYMENT': paymentToken 
          },
          body: JSON.stringify({ fid: user.fid })
        });
        
        console.log("Final response status:", finalResponse.status);
        
        if (finalResponse.ok) {
            const data = await finalResponse.json();
            alert(data.message);
            if (data.txHash) {
                setLastTxHash(data.txHash); // Set the transaction hash
            }
            const statusResponse = await fetch(`/api/user-status?fid=${user.fid}`);
            if (statusResponse.ok) setUserStatus(await statusResponse.json());
        } else {
            const errorData = await finalResponse.json();
            console.error("Final response error:", errorData);
            // Show the specific validation errors
            if (errorData.error && errorData.error.issues) {
              console.error("Validation issues:", errorData.error.issues);
              throw new Error(`Validation failed: ${JSON.stringify(errorData.error.issues)}`);
            }
            // Handle insufficient funds error specifically
            if (errorData.error === 'insufficient_funds') {
              throw new Error("Insufficient funds in your Base Sepolia wallet. To resolve this:\n\n1. Make sure you're connected to the Base Sepolia network in your wallet\n2. Get test ETH from a Base Sepolia faucet (e.g., https://base.org/faucet or https://sepoliafaucet.com)\n3. Try the upgrade again");
            }
            throw new Error(errorData.message || "Upgrade failed after payment.");
        }
      } else if (!initialResponse.ok) {
        const errorData = await initialResponse.json();
        console.error("Initial response error:", errorData);
        throw new Error(errorData.message || "An unexpected error occurred.");
      } else {
        alert("Upgrade not needed. Your account is already Pro.");
        const statusResponse = await fetch(`/api/user-status?fid=${user.fid}`);
        if (statusResponse.ok) setUserStatus(await statusResponse.json());
      }
    } catch (error: any) {
      console.error("Upgrade process error:", error);
      console.error("Error stack:", error.stack);
      alert(`Upgrade failed: ${error.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };
  
  const hasReachedLimit = userStatus && !userStatus.is_pro && userStatus.monthly_cast_count >= 15;

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>FarQueue</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Your smart Farcaster scheduler</p>
        </div>
        <NeynarAuthButton />
      </header>

      {!isAuthenticated ? (
        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px solid #333', borderRadius: '8px' }}>
          <p>Please sign in with Farcaster to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {lastTxHash && (
              <div style={{ padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', textAlign: 'center' }}>
                  <p>On-chain action successful! ✅</p>
                  <a 
                      href={`https://base-sepolia.blockscout.com/tx/${lastTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#8a63d2', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                      View on Block Explorer
                  </a>
              </div>
          )}
          
          {userStatus && (
            <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {userStatus.is_pro ? (
                <p style={{ color: '#28a745', fontWeight: 'bold' }}>Pro Member: You have unlimited casts!</p>
              ) : (
                <p>
                  You have used <b>{userStatus.monthly_cast_count}</b> of 15 free casts this month.
                </p>
              )}

              {!userStatus.is_pro && (
                 <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    {isUpgrading ? 'Processing...' : 'Upgrade'}
                </button>
              )}
            </div>
          )}

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Schedule a Cast</h2>
            
            {hasReachedLimit ? (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '15px' }}>You've reached your monthly free limit.</p>
                    <button
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        {isUpgrading ? 'Processing...' : 'Upgrade for Unlimited Casts'}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleScheduleCast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <textarea
                    value={castText}
                    onChange={(e) => setCastText(e.target.value)}
                    placeholder="What's happening on Farcaster?"
                    maxLength={320}
                    rows={5}
                    style={{ padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#222', color: 'white' }}
                  />
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    style={{ padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#222', color: 'white' }}
                  />
                  <button type="submit" style={{ padding: '12px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                    Schedule Cast
                  </button>
                </form>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Queue</h2>
            {isLoading ? <p>Loading casts...</p> : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {scheduledCasts && scheduledCasts.length > 0 ? (
                    scheduledCasts.map((cast) => (
                    <li key={cast.id} style={{ backgroundColor: '#111', border: '1px solid #333', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>"{cast.cast_text}"</p>
                        <small style={{ color: '#a0a0a0' }}>
                        Scheduled for: {new Date(cast.publish_at).toLocaleString()}
                        <br />
                        Status: <span style={{ fontWeight: 'bold', color: cast.is_published ? '#28a745' : '#ffc107' }}>{cast.is_published ? `Published` : 'Pending'}</span>
                        </small>
                    </li>
                    ))
                ) : (
                    <p style={{ color: '#a0a0a0' }}>Your queue is empty. Schedule a cast to see it here.</p>
                )}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}