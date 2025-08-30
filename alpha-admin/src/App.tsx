// File: src/App.tsx
import { useEffect, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cycleDay, setCycleDay] = useState('');
  const [cyclePhase, setCyclePhase] = useState('Accumulation');
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session?.user?.id)
        .single();

      if (data?.is_admin) setIsAdmin(true);
    }

    if (session?.user?.id) checkAdmin();
  }, [session]);

  const sendAlert = async () => {
    setStatus('Sending...');
    const response = await fetch(
      `https://fnvrmwbnwosobyoagemz.functions.supabase.co/send-alert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title,
          body,
          cycle_day: parseInt(cycleDay, 10),
          cycle_phase: cyclePhase,
        }),
      }
    );

    if (response.ok) {
      setStatus('Alert sent!');
      setTitle('');
      setBody('');
      setCycleDay('');
      setCyclePhase('Accumulation');
    } else {
      setStatus('Error sending alert');
    }
  };

  if (!session) {
    return (
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
        Login with Google
      </button>
    );
  }

  if (!isAdmin) {
    return <p>Access denied: admin only</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Send Admin Alert</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" />
      <input
        value={cycleDay}
        onChange={(e) => setCycleDay(e.target.value)}
        placeholder="Cycle Day (number)"
      />
      <select value={cyclePhase} onChange={(e) => setCyclePhase(e.target.value)}>
        <option value="Accumulation">Accumulation</option>
        <option value="Advance">Advance</option>
        <option value="Distribution">Distribution</option>
        <option value="Decline">Decline</option>
      </select>
      <button onClick={sendAlert}>Send Alert</button>
      <p>{status}</p>
    </div>
  );
}
