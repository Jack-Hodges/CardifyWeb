import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import supabase from '../supabaseClient';
import Card from '../components/Card/Card';
import BackgroundButton from '../components/Elements/BackgroundButton';

/**
 * Public read-only study page — no account required.
 */
function PublicStudy() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_public_subject_by_token', {
        p_token: token,
      });
      if (rpcError || !data?.subject) {
        setError('This study link is invalid or has been revoked.');
        setPayload(null);
      } else {
        setPayload(data);
        setError(null);
      }
      setLoading(false);
    };
    if (token) load();
  }, [token]);

  const cards = payload?.cards || [];
  const subject = payload?.subject;
  const pageTitle = subject?.name
    ? `${subject.name} — Public study | Cardify`
    : error
      ? 'Study link unavailable | Cardify'
      : 'Public study | Cardify';
  const pageDescription = subject?.name
    ? `Study “${subject.name}” on Cardify${cards.length ? ` — ${cards.length} flashcard${cards.length === 1 ? '' : 's'}` : ''}. No account required.`
    : 'Shared Cardify flashcard study link.';

  return (
    <div className="w-screen min-h-[100dvh] relative overflow-hidden bg-gray-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Public study</p>
            <h1 className="text-xl font-bold text-white">{subject?.name || 'Cardify'}</h1>
          </div>
          <BackgroundButton
            text="Open Cardify"
            bgColor="bg-blue-500 hover:bg-blue-400"
            onClick={() => navigate('/')}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <p className="text-white/70 text-center">Loading…</p>
          ) : error ? (
            <p className="text-red-300 text-center font-semibold">{error}</p>
          ) : cards.length === 0 ? (
            <p className="text-white/70 text-center">No cards in this subject.</p>
          ) : (
            <div className="max-w-2xl mx-auto">
              <p className="text-white/70 text-sm font-medium mb-3 text-center">
                Card {index + 1} of {cards.length}
              </p>
              <Card
                card={cards[index]}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip
                practice
              />
              <div className="flex justify-center gap-3 mt-6">
                <BackgroundButton
                  text="Previous"
                  bgColor="bg-gray-600 hover:bg-gray-500"
                  disabled={index === 0}
                  onClick={() => {
                    setIndex((i) => Math.max(0, i - 1));
                    setFlipped(false);
                  }}
                />
                <BackgroundButton
                  text="Next"
                  bgColor="bg-blue-500 hover:bg-blue-400"
                  disabled={index >= cards.length - 1}
                  onClick={() => {
                    setIndex((i) => Math.min(cards.length - 1, i + 1));
                    setFlipped(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicStudy;
