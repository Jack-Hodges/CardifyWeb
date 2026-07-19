import { useState } from 'react';
import featureFlags from '../../config/featureFlags';
import supabase from '../../supabaseClient';
import BackgroundButton from '../Elements/BackgroundButton';
import { toast } from 'react-toastify';

/**
 * Generate flashcards from notes / pasted text / PDF text — gated off by default.
 */
function NotesGeneratePanel({ onGenerated, disabled }) {
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!featureFlags.aiGenerateFromNotes) return null;

  const handleGenerate = async () => {
    if (!notes.trim()) {
      toast.error('Paste some notes first');
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sign in required');

      const response = await fetch('/api/flashcardGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          count,
          topic: notes.slice(0, 4000),
          fromNotes: true,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Generate failed');
      }
      const text = await response.text();
      onGenerated?.(text);
      setNotes('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-black/30 p-4 space-y-3">
      <h3 className="text-white font-bold text-lg">Generate from notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder="Paste lecture notes or PDF text…"
        className="w-full rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3"
        disabled={disabled || loading}
      />
      <div className="flex items-center gap-3">
        <label className="text-white/80 text-sm font-medium">
          Cards
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 10)}
            className="ml-2 w-16 rounded-lg px-2 py-1 text-gray-900"
          />
        </label>
        <BackgroundButton
          text={loading ? 'Generating…' : 'Generate'}
          bgColor="bg-purple-500 hover:bg-purple-400"
          disabled={disabled || loading}
          onClick={handleGenerate}
        />
      </div>
    </div>
  );
}

export default NotesGeneratePanel;
