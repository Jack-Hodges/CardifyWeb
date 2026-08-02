import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Card from '../components/Card/Card';
import BackgroundButton from '../components/Elements/BackgroundButton';
import ThemeBackground from '../components/Elements/ThemeBackground';
import LoadingSpinner from '../components/Elements/LoadingSpinner';
import { useUser } from '../UserContext';
import {
  getDiscoverSubject,
  addToLibrary,
  isInLibrary,
} from '../components/Subject/SubjectManipulation';
import { toast } from '../components/Toast';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

/**
 * Free Discover practice — no account required. Saving requires sign-in.
 */
function DiscoverStudy() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { theme, colorScheme, user } = useUser();
  const { primaryColor, secondaryColor, textColor } = theme;
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getDiscoverSubject(Number(subjectId));
      if (!data?.subject) {
        setError('This subject is not available in Discover.');
        setPayload(null);
      } else {
        setPayload(data);
        setError(null);
        setIndex(0);
        setFlipped(false);
      }
      setLoading(false);
    };
    if (subjectId) load();
  }, [subjectId]);

  useEffect(() => {
    if (!user?.id || !subjectId) {
      setInLibrary(false);
      return;
    }
    isInLibrary(Number(subjectId), user.id).then(setInLibrary);
  }, [user?.id, subjectId]);

  const cards = payload?.cards || [];
  const subject = payload?.subject;

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  };

  const goNext = () => {
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  useEffect(() => {
    if (loading || error || !cards.length) return;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, cards.length, index]);

  const handleAdd = async () => {
    if (!user) {
      navigate('/?signup=1');
      return;
    }
    setAdding(true);
    const result = await addToLibrary(Number(subjectId));
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error || 'Could not add subject');
      return;
    }
    setInLibrary(true);
    toast.success('Added to your dashboard');
  };

  const pageTitle = subject?.name
    ? `${subject.name} — Discover | Cardify`
    : error
      ? 'Subject unavailable | Cardify'
      : 'Discover | Cardify';

  return (
    <div
      className="w-screen min-h-[100lvh] relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundColor: 'var(--theme-background-color)',
        backgroundImage: 'var(--theme-background-image)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            subject?.name
              ? `Practice “${subject.name}” from Cardify Discover. Free, no account required.`
              : 'Practice a free published subject on Cardify Discover.'
          }
        />
      </Helmet>

      <ThemeBackground />

      <div className="relative z-10 min-h-[100lvh] flex flex-col">
        <header className="flex items-center justify-between gap-4 px-4 mb-2 pt-2">
          <button
            type="button"
            className="flex items-center gap-3 min-w-0 text-left"
            onClick={() => navigate('/discover')}
          >
            <img src={CardifyLogo} alt="Cardify" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${textColor}`}>
                Discover
                {payload?.listing?.publisher_username
                  ? ` · @${payload.listing.publisher_username}`
                  : ''}
              </p>
              <h1 className={`text-xl sm:text-2xl font-bold truncate ${textColor}`}>
                {subject?.name || 'Cardify'}
              </h1>
            </div>
          </button>
          <div className="flex gap-2 shrink-0">
            <BackgroundButton
              text="Back"
              bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
              onClick={() => navigate('/discover')}
            />
            {user ? (
              <BackgroundButton
                text="Home"
                bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                onClick={() => navigate('/home')}
              />
            ) : (
              <BackgroundButton
                text="Sign in"
                bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                onClick={() => navigate('/')}
              />
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center px-5 sm:px-7 py-6">
          {loading ? (
            <LoadingSpinner text="Loading subject…" />
          ) : error ? (
            <div className="max-w-md mx-auto text-center rounded-2xl bg-white/40 border border-black/10 backdrop-blur-sm px-6 py-8">
              <p className="text-red-600 font-semibold">{error}</p>
              <div className="mt-5 flex justify-center">
                <BackgroundButton
                  text="Back to Discover"
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  onClick={() => navigate('/discover')}
                />
              </div>
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
                Tap the card to flip · Space flips · ← → move
              </p>

              <div className="flex justify-center gap-3 mt-6">
                <BackgroundButton
                  text="Previous"
                  bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                  disabled={index === 0}
                  onClick={goPrev}
                />
                <BackgroundButton
                  text="Next"
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  disabled={index >= cards.length - 1}
                  onClick={goNext}
                />
              </div>

              <div className="mt-8 max-w-lg mx-auto rounded-2xl bg-white/35 border border-black/10 backdrop-blur-sm px-5 py-5 text-center">
                {user ? (
                  <>
                    <p className="font-bold text-gray-900 text-lg">
                      {inLibrary ? 'In your library' : 'Save this subject?'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1 mb-4">
                      {inLibrary
                        ? 'Open your dashboard to practice with games and spaced repetition.'
                        : 'Add it to your dashboard to keep practising with full Cardify modes.'}
                    </p>
                    {inLibrary ? (
                      <BackgroundButton
                        text="Open Dashboard"
                        bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                        wWidth="w-full sm:w-auto"
                        onClick={() => navigate('/dashboard')}
                      />
                    ) : (
                      <BackgroundButton
                        text={adding ? 'Adding…' : 'Add to dashboard'}
                        bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                        wWidth="w-full sm:w-auto"
                        disabled={adding}
                        onClick={handleAdd}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-lg">Practising as a guest</p>
                    <p className="text-sm text-gray-700 mt-1 mb-4">
                      Create a free account to save this subject and unlock games, progress, and your own decks.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <BackgroundButton
                        text="Create free account"
                        bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                        wWidth="w-full sm:w-auto"
                        onClick={() => navigate('/?signup=1')}
                      />
                      <BackgroundButton
                        text="Browse more"
                        bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                        wWidth="w-full sm:w-auto"
                        onClick={() => navigate('/discover')}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DiscoverStudy;
