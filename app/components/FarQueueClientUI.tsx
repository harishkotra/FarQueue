"use client";

import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { User } from "@neynar/react/dist/types";
import { useEffect, useState, useCallback, FormEvent } from "react";
import { useAccount, useConnect } from "wagmi";
import { getWalletClient } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { config } from '@/lib/wagmi';
import Link from 'next/link';

const EIP712Domain = { name: "x402", version: "1" };
const EIP712Types = {
  Payment: [
    { name: "amount", type: "uint256" }, { name: "asset", type: "address" },
    { name: "recipient", type: "address" }, { name: "nonce", type: "uint256" },
  ],
};

async function createPaymentToken(paymentRequirements: any, walletClient: any): Promise<string> {
  try {
    const nonceArray = new Uint8Array(32);
    crypto.getRandomValues(nonceArray);
    const nonce = '0x' + Array.from(nonceArray).map(b => b.toString(16).padStart(2, '0')).join('');
    const validAfter = BigInt(Math.floor(Date.now() / 1000) - 600).toString();
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + paymentRequirements.maxTimeoutSeconds).toString();
    const authorization = {
      from: walletClient.account.address,
      to: paymentRequirements.payTo,
      value: paymentRequirements.maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce
    };
    const signature = await walletClient.signTypedData({
      domain: {
        name: paymentRequirements.extra.name,
        version: paymentRequirements.extra.version,
        chainId: 84532,
        verifyingContract: paymentRequirements.asset
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' }, { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" }, { name: "to", type: "address" },
          { name: "value", type: "uint256" }, { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" }
        ]
      },
      primaryType: 'TransferWithAuthorization',
      message: authorization
    });
    const paymentToken = {
      x402Version: 1, scheme: paymentRequirements.scheme, network: paymentRequirements.network,
      payload: { signature: signature, authorization: authorization }
    };
    const encodedToken = Buffer.from(JSON.stringify(paymentToken)).toString('base64');
    return encodedToken;
  } catch (error) {
    console.error("Error in createPaymentToken:", error);
    throw error;
  }
}

interface ScheduledCast { id: number; cast_text: string; publish_at: string; is_published: boolean; published_hash: string | null; }
interface UserStatus { is_pro: boolean; monthly_cast_count: number; }

interface User {
  fid: number;
  username: string;
  display_name?: string;
  displayName?: string;
  pfp?: {
    url: string;
  };
  profile?: {
    bio: {
      text: string;
    };
  };
}

interface ScheduledCast { id: number; cast_text: string; publish_at: string; is_published: boolean; published_hash: string | null; }
interface UserStatus { is_pro: boolean; monthly_cast_count: number; }

const toDateTimeLocal = (date: Date): string => { return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`; };

interface EngagementScore {
  score: number;
  justification: string;
}

export function FarQueueClientUI() {
  const { user, isAuthenticated } = useNeynarContext();
  const [castText, setCastText] = useState<string>("");
  const [publishAt, setPublishAt] = useState<string>("");
  const [scheduledCasts, setScheduledCasts] = useState<ScheduledCast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [engagementScore, setEngagementScore] = useState<EngagementScore | null>(null);

  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  
  // All other logic hooks and functions remain exactly the same as the previous working version.
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
        alert("Cast scheduled successfully!");
        setCastText("");
        setPublishAt("");
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
      if (!walletClient) {
        alert("Please connect your wallet in the popup.");
        await connectAsync({ connector: injected() });
        walletClient = await getWalletClient(config);
      }
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
        
        const paymentRequirements = responseBody.accepts?.[0]; 
        
        if (!paymentRequirements) {
            throw new Error("Payment requirements not found in the server response.");
        }
        
        alert("Please confirm the transaction in your wallet to complete the upgrade.");
        const paymentToken = await createPaymentToken(paymentRequirements, walletClient);
        
        const finalResponse = await fetch('/api/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-PAYMENT': paymentToken },
          body: JSON.stringify({ fid: user.fid })
        });
        
        if (finalResponse.ok) {
            const data = await finalResponse.json();
            alert(data.message);
            const statusResponse = await fetch(`/api/user-status?fid=${user.fid}`);
            if (statusResponse.ok) setUserStatus(await statusResponse.json());
        } else {
            const errorData = await finalResponse.json();
            if (errorData.error === 'insufficient_funds') {
              throw new Error("Insufficient funds in your Base Sepolia wallet. To resolve this:\n\n1. Make sure you're connected to the Base Sepolia network in your wallet\n2. Get testnet USDC from a faucet if required, or ensure you have enough ETH for gas.\n3. Try the upgrade again");
            }
            throw new Error(errorData.message || "Upgrade failed after payment.");
        }
      } else if (!initialResponse.ok) {
        const errorData = await initialResponse.json();
        throw new Error(errorData.message || "An unexpected error occurred.");
      } else {
        alert("Upgrade not needed. Your account is already Pro.");
        const statusResponse = await fetch(`/api/user-status?fid=${user.fid}`);
        if (statusResponse.ok) setUserStatus(await statusResponse.json());
      }
    } catch (error: any) {
      console.error("Upgrade process error:", error);
      alert(`Upgrade failed: ${error.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleOptimize = async () => {
    if (!castText.trim()) {
      alert("Please write something before optimizing.");
      return;
    }
    setIsOptimizing(true);
    setAiSuggestions(null);
    setEngagementScore(null);
    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castText }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to get AI suggestions.");
      }
      const data = await response.json();
      setAiSuggestions(data.rewrites);
      setEngagementScore(data.engagementScore);
    } catch (error: any) {
      console.error("AI Optimization failed:", error);
      alert(error.message);
    } finally {
      setIsOptimizing(false);
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
          {/* NEW: Add a link to the dashboard next to the sign-in button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {isAuthenticated && user && (
                  <Link href={`/dashboard/${user.fid}`} style={{ color: '#a0a0a0', textDecoration: 'underline' }}>
                      Dashboard
                  </Link>
              )}
              <NeynarAuthButton />
          </div>
      </header>
       {!isAuthenticated ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '40px 20px', marginBottom: '40px' }}>
                <p style={{ fontSize: '1.1rem' }}>Please sign in with Farcaster to get started.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '10px' }}>What is FarQueue?</h2>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗓️</span>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Schedule Your Content</h3>
                        <p style={{ color: '#a0a0a0', marginTop: '5px' }}>Never miss the perfect moment to post. Write your casts now and let FarQueue publish them for you automatically at any time in the future.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✨</span>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Optimize with AI</h3>
                        <p style={{ color: '#a0a0a0', marginTop: '5px' }}>Supercharge your casts with our built-in AI assistant. Get suggestions for rewrites and an instant engagement score to maximize your reach.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔗</span>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Verifiable On-Chain Activity</h3>
                        <p style={{ color: '#a0a0a0', marginTop: '5px' }}>Every user's first action and every pro upgrade is recorded on the Base Sepolia blockchain, making your engagement transparent and verifiable.</p>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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
                        {isUpgrading ? 'Processing...' : 'Upgrade for 0.01 ETH'}
                    </button>
                    <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginTop: '10px' }}>on Base Sepolia</p>
                </div>
            ) : (
                <form onSubmit={handleScheduleCast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ position: 'relative' }}>
                    <textarea
                        value={castText}
                        onChange={(e) => setCastText(e.target.value)}
                        placeholder="What's happening on Farcaster?"
                        maxLength={320}
                        rows={5}
                        style={{ padding: '12px', paddingTop: '12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#222', color: 'white', width: '100%' }}
                    />
                    <button
                        type="button"
                        onClick={handleOptimize}
                        disabled={isOptimizing || !castText.trim()}
                        style={{
                            position: 'absolute', 
                            bottom: '12px',
                            right: '12px', 
                            zIndex: 10,
                            padding: '6px 12px', 
                            fontSize: '0.8rem', 
                            cursor: 'pointer',
                            backgroundColor: isOptimizing ? '#555' : '#8a63d2', 
                            color: 'white',
                            border: 'none', 
                            borderRadius: '5px', 
                            opacity: !castText.trim() ? 0.5 : 1
                        }}
                    >
                        {isOptimizing ? 'Optimizing...' : '✨ Optimize with AI'}
                    </button>
                  </div>
                  {engagementScore && aiSuggestions && (
                    <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Engagement Score: {engagementScore.score}/100</h4>
                        <p style={{ color: '#a0a0a0', fontSize: '0.9rem', fontStyle: 'italic' }}>"{engagementScore.justification}"</p>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '15px' }}>Suggestions:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {aiSuggestions.map((suggestion, index) => (
                          <li key={index} style={{ border: '1px solid #333', borderRadius: '5px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ flex: 1, marginRight: '10px' }}>{suggestion}</p>
                            <button
                              type="button"
                              onClick={() => setCastText(suggestion)}
                              style={{ padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                              Use
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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