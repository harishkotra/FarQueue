"use client";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { User } from "@neynar/react/dist/types";
import { useEffect, useState, useCallback, FormEvent } from "react";

interface ScheduledCast {
  id: number;
  cast_text: string;
  publish_at: string;
  is_published: boolean;
  published_hash: string | null;
}

// Helper function to format dates for the datetime-local input
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

  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const min = new Date(now.getTime() + 5 * 60 * 1000);
    const max = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
    setMinDate(toDateTimeLocal(min));
    setMaxDate(toDateTimeLocal(max));
  }, []);

  const saveUserToDatabase = useCallback(async (userData: User) => {
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      saveUserToDatabase(user);
    }
  }, [user, saveUserToDatabase]);

  const fetchScheduledCasts = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/scheduled-casts?fid=${user.fid}`);
      if (response.ok) {
        const data = await response.json();
        // Defensive check: only update state if data.casts is an array
        if (Array.isArray(data.casts)) {
          setScheduledCasts(data.casts);
        }
      } else {
        console.error("API call to fetch casts failed");
        setScheduledCasts([]); // Reset to empty array on failure
      }
    } catch (error) {
      console.error("Failed to fetch casts:", error);
      setScheduledCasts([]); // Reset to empty array on failure
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchScheduledCasts();
    }
  }, [isAuthenticated, fetchScheduledCasts]);

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
        body: JSON.stringify({ fid: user.fid, castText, publishAt }),
      });

      if (response.ok) {
        alert("Cast scheduled successfully!");
        setCastText("");
        setPublishAt("");
        fetchScheduledCasts();
      } else {
        throw new Error('Failed to schedule cast.');
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while scheduling your cast.");
    }
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem' }}>Farcaster Cast Scheduler</h1>
        <NeynarAuthButton />
      </header>

      {!isAuthenticated ? (
        <p>Please sign in with Farcaster to schedule a cast.</p>
      ) : (
        <div>
          {user && <p style={{ fontSize: '1.2rem' }}>Welcome, {user.displayName} (@{user.username})!</p>}

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Schedule a New Cast</h2>
            <form onSubmit={handleScheduleCast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <textarea
                value={castText}
                onChange={(e) => setCastText(e.target.value)}
                placeholder="What's happening?"
                maxLength={320}
                rows={4}
                style={{ padding: '10px', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                min={minDate}
                max={maxDate}
                style={{ padding: '10px', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#8a63d2', color: 'white', border: 'none', borderRadius: '5px' }}>
                Schedule Cast
              </button>
            </form>
          </section>

          <section>
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Your Scheduled Casts</h2>
            {isLoading ? <p>Loading casts...</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {scheduledCasts && scheduledCasts.map((cast) => (
                  <li key={cast.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                    <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>"{cast.cast_text}"</p>
                    <small>
                      Scheduled for: {new Date(cast.publish_at).toLocaleString()}
                      <br />
                      Status: {cast.is_published ? `Published (hash: ${cast.published_hash?.substring(0, 10)}...)` : 'Pending'}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}