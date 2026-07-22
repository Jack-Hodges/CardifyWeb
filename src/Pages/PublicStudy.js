import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import supabase from '../supabaseClient';
import Card from '../components/Card/Card';
import BackgroundButton from '../components/Elements/BackgroundButton';
import ThemeBackground from '../components/Elements/ThemeBackground';
import { useUser } from '../UserContext';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

/**
 * Public read-only study page — no account required.
 */
function PublicStudy() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme, colorScheme } = useUser();
  const { primaryColor, secondaryColor, textColor } = theme;
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
    <div className="w-screen min-h-[100dvh] relative overflow-hidden">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <ThemeBackground />

      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        <header className="flex items-center justify-between gap-4 px-4 mb-2 pt-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src={CardifyLogo} alt="Cardify" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${textColor}`}>
                Public study
              </p>
              <h1 className={`text-xl sm:text-2xl font-bold truncate ${textColor}`}>
                {subject?.name || 'Cardify'}
              </h1>
            </div>
          </div>
          <BackgroundButton
            text="Open Cardify"
            bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
            onClick={() => navigate('/')}
          />
        </header>

        <main className="flex-1 flex flex-col justify-center px-5 sm:px-7 py-6">
          {loading ? (
            <p className={`${textColor} text-center font-medium opacity-80`}>Loading…</p>
          ) : error ? (
            <div className="max-w-md mx-auto text-center rounded-2xl bg-white/40 border border-black/10 backdrop-blur-sm px-6 py-8">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : cards.length === 0 ? (
            <p className={`${textColor} text-center font-medium opacity-80`}>
              No cards in this subject.
            </p>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              <p className={`${textColor} text-sm sm:text-base font-bold mb-4 text-center`}>
                Card {index + 1} of {cards.length}
              </p>

              <div className="w-full h-[50vh] sm:h-[60vh] min-h-[280px]">
                <Card
                  card={cards[index]}
                  flipped={flipped}
                  setFlipped={setFlipped}
                  animateFlip
                  practice
                  lightSurface={colorScheme === 'light'}
                />
              </div>

              <p className={`${textColor} text-sm text-center mt-4 opacity-70 font-medium`}>
                Tap the card to flip
              </p>

              <div className="flex justify-center gap-3 mt-6">
                <BackgroundButton
                  text="Previous"
                  bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                  disabled={index === 0}
                  onClick={() => {
                    setIndex((i) => Math.max(0, i - 1));
                    setFlipped(false);
                  }}
                />
                <BackgroundButton
                  text="Next"
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  disabled={index >= cards.length - 1}
                  onClick={() => {
                    setIndex((i) => Math.min(cards.length - 1, i + 1));
                    setFlipped(false);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default PublicStudy;
