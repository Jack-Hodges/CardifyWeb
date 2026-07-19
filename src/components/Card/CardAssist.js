import { useState } from 'react';
import featureFlags from '../../config/featureFlags';
import supabase from '../../supabaseClient';
import BackgroundButton from '../Elements/BackgroundButton';

/**
 * Explain / simplify assist — gated by featureFlags.aiCardAssist (off by default).
 */
function CardAssist({ question, answer, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!featureFlags.aiCardAssist) return null;

  const run = async (mode) => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sign in required');

      const response = await fetch('/api/cardAssist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode, question, answer }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Assist failed');
      }
      const data = await response.json();
      setResult(data.text || data.result || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-white/20 bg-black/25 p-3">
      <p className="text-sm font-semibold text-white/80 mb-2">AI card assist</p>
      <div className="flex flex-wrap gap-2">
        <BackgroundButton
          text={loading ? '…' : 'Explain'}
          bgColor="bg-blue-500 hover:bg-blue-400"
          disabled={loading}
          onClick={() => run('explain')}
        />
        <BackgroundButton
          text={loading ? '…' : 'Simplify'}
          bgColor="bg-teal-500 hover:bg-teal-400"
          disabled={loading}
          onClick={() => run('simplify')}
        />
        {result && onApply && (
          <BackgroundButton
            text="Apply"
            bgColor="bg-green-500 hover:bg-green-400"
            onClick={() => onApply(result)}
          />
        )}
      </div>
      {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
      {result && (
        <p className="text-white/90 text-sm mt-2 whitespace-pre-wrap">{result}</p>
      )}
    </div>
  );
}

export default CardAssist;
