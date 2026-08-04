import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, CirclePlay, Eye } from 'lucide-react';
import Card from '../components/Card/Card';
import BackgroundButton from '../components/Elements/BackgroundButton';
import ThemeBackground from '../components/Elements/ThemeBackground';
import LoadingSpinner from '../components/Elements/LoadingSpinner';
import TitleBar from '../components/Navigation/TitleBar';
import SafeMarkdown from '../components/Functions/SafeMarkdown';
import getColors from '../components/Functions/getColors';
import { useUser } from '../UserContext';
import {
  getDiscoverSubject,
  addToLibrary,
  isInLibrary,
} from '../components/Subject/SubjectManipulation';
import { toast } from '../components/Toast';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

const VIEW_PAGE_SIZE = 25;

/**
 * Free Discover practice / view — guests get a light header; signed-in users keep TitleBar.
 */
function DiscoverStudy() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'view' ? 'view' : 'practice';
  const { theme, colorScheme, user } = useUser();
  const { primaryColor, secondaryColor, textClass, shadow } = theme || {};
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);
  const [adding, setAdding] = useState(false);
  const [viewVisibleCount, setViewVisibleCount] = useState(VIEW_PAGE_SIZE);

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
    setViewVisibleCount(VIEW_PAGE_SIZE);
  }, [subjectId, mode]);

  useEffect(() => {
    if (!user?.id || !subjectId) {
      setInLibrary(false);
      return;
    }
    isInLibrary(Number(subjectId), user.id).then(setInLibrary);
  }, [user?.id, subjectId]);

  const cards = payload?.cards || [];
  const subject = payload?.subject;
  const isOwn = Boolean(user && payload?.listing?.publisher_id === user.id);
  const subjectColors = useMemo(() => {
    const color = subject?.colourText;
    const intensity = Number(subject?.colourIntensity);
    if (typeof color === 'string' && Number.isFinite(intensity)) {
      try {
        return getColors([color, intensity]);
      } catch {
        // fall through
      }
    }
    return { bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-400' };
  }, [subject?.colourText, subject?.colourIntensity]);

  const setMode = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'view') nextParams.set('mode', 'view');
    else nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });
    setFlipped(false);
  };

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  };

  const goNext = () => {
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  useEffect(() => {
    if (loading || error || !cards.length || mode !== 'practice') return;
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
  }, [loading, error, cards.length, index, mode]);

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
  const pageDescription = subject?.name
    ? `Practice “${subject.name}” from Cardify Discover. Free, no account required.`
    : 'Practice a free published subject on Cardify Discover.';
  const canonicalUrl = subjectId
    ? `https://cardify.app/discover/${subjectId}`
    : 'https://cardify.app/discover';

  const headingClass = textClass || 'text-white';
  const backToDiscover = () => navigate('/discover');
  const primaryBtn = `${primaryColor?.bgClass || 'bg-green-500'} ${primaryColor?.hoverClass || 'hover:bg-green-400'}`;
  const secondaryBtn = `${secondaryColor?.bgClass || 'bg-orange-500'} ${secondaryColor?.hoverClass || 'hover:bg-orange-400'}`;

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
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://cardify.app/logo512.png" />
        <meta property="og:image:alt" content="Cardify flashcard deck preview" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://cardify.app/logo512.png" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <ThemeBackground />

      <div className="relative z-10 min-h-[100lvh] flex flex-col">
        {user ? (
          <TitleBar text="Discover" />
        ) : (
          <header className="flex items-center justify-between gap-4 px-4 mb-2 pt-2">
            <button
              type="button"
              className="flex items-center gap-3 min-w-0 text-left"
              onClick={backToDiscover}
            >
              <img src={CardifyLogo} alt="Cardify" className="h-9 w-auto shrink-0" />
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${headingClass}`}>
                  Discover
                  {payload?.listing?.publisher_username
                    ? ` · @${payload.listing.publisher_username}`
                    : ''}
                </p>
                <h1 className={`text-xl sm:text-2xl font-bold truncate ${headingClass}`}>
                  {subject?.name || 'Cardify'}
                </h1>
              </div>
            </button>
            <BackgroundButton
              text="Sign in"
              bgColor={primaryBtn}
              onClick={() => navigate('/')}
            />
          </header>
        )}

        {subject && !loading && !error && (
          <div className="px-4 mt-1 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <BackgroundButton
                image={<ChevronLeft size={20} strokeWidth={3} />}
                bgColor={secondaryBtn}
                onClick={backToDiscover}
                aria-label="Back to Discover"
              />
              <div className="min-w-0 pt-0.5">
                <h1
                  className={`text-2xl sm:text-3xl font-bold truncate ${headingClass} ${
                    shadow ? 'drop-shadow-custom' : ''
                  }`}
                >
                  {subject.name}
                </h1>
                <p className={`text-sm opacity-75 ${headingClass}`}>
                  {payload?.listing?.publisher_username
                    ? `@${payload.listing.publisher_username}`
                    : 'Discover'}
                  {' · '}
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  {mode === 'view' ? ' · browsing' : ' · practice'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === 'view' ? (
                <BackgroundButton
                  text="Practice"
                  image={<CirclePlay size={18} />}
                  flip
                  bgColor={primaryBtn}
                  onClick={() => setMode('practice')}
                />
              ) : (
                <BackgroundButton
                  text="View all"
                  image={<Eye size={18} />}
                  flip
                  bgColor={primaryBtn}
                  onClick={() => setMode('view')}
                />
              )}
            </div>
          </div>
        )}

        <main
          className={`flex-1 flex flex-col px-5 sm:px-7 py-4 ${
            mode === 'practice' ? 'justify-center' : 'justify-start pb-16'
          }`}
        >
          {loading ? (
            <LoadingSpinner text="Loading subject…" />
          ) : error ? (
            <div className="max-w-md mx-auto text-center rounded-2xl bg-white/40 border border-black/10 backdrop-blur-sm px-6 py-8">
              <p className="text-red-600 font-semibold">{error}</p>
              <div className="mt-5 flex justify-center">
                <BackgroundButton
                  text="Back to Discover"
                  bgColor={primaryBtn}
                  onClick={backToDiscover}
                />
              </div>
            </div>
          ) : cards.length === 0 ? (
            <p className={`${headingClass} text-center font-medium opacity-80`}>
              No cards in this subject.
            </p>
          ) : mode === 'view' ? (
            <DiscoverCardBrowser
              cards={cards}
              visibleCount={viewVisibleCount}
              onShowMore={() => setViewVisibleCount((n) => n + VIEW_PAGE_SIZE)}
              subjectColors={subjectColors}
              headingClass={headingClass}
              primaryColor={primaryColor}
              shadow={shadow}
            />
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              <p className={`${headingClass} text-sm sm:text-base font-bold mb-4 text-center`}>
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

              <p className={`${headingClass} text-sm text-center mt-4 opacity-70 font-medium`}>
                Tap the card to flip · Space flips · ← → move
              </p>

              <div className="flex justify-center gap-3 mt-6">
                <BackgroundButton
                  text="Previous"
                  bgColor={secondaryBtn}
                  disabled={index === 0}
                  onClick={goPrev}
                />
                <BackgroundButton
                  text="Next"
                  bgColor={primaryBtn}
                  disabled={index >= cards.length - 1}
                  onClick={goNext}
                />
              </div>

              <div className="mt-8 max-w-lg mx-auto rounded-2xl bg-white/35 border border-black/10 backdrop-blur-sm px-5 py-5 text-center">
                {user ? (
                  isOwn ? (
                    <>
                      <p className="font-bold text-gray-900 text-lg">This is your published subject</p>
                      <p className="text-sm text-gray-700 mt-1 mb-4">
                        Manage it from your dashboard or Share settings.
                      </p>
                      <BackgroundButton
                        text="Open Dashboard"
                        bgColor={secondaryBtn}
                        wWidth="w-full sm:w-auto"
                        onClick={() => navigate('/dashboard')}
                      />
                    </>
                  ) : (
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
                          bgColor={secondaryBtn}
                          wWidth="w-full sm:w-auto"
                          onClick={() => navigate('/dashboard')}
                        />
                      ) : (
                        <BackgroundButton
                          text={adding ? 'Adding…' : 'Add to dashboard'}
                          bgColor={secondaryBtn}
                          wWidth="w-full sm:w-auto"
                          disabled={adding}
                          onClick={handleAdd}
                        />
                      )}
                    </>
                  )
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-lg">Practising as a guest</p>
                    <p className="text-sm text-gray-700 mt-1 mb-4">
                      Create a free account to save this subject and unlock games, progress, and your own decks.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <BackgroundButton
                        text="Create free account"
                        bgColor={secondaryBtn}
                        wWidth="w-full sm:w-auto"
                        onClick={() => navigate('/?signup=1')}
                      />
                      <BackgroundButton
                        text="Browse more"
                        bgColor={primaryBtn}
                        wWidth="w-full sm:w-auto"
                        onClick={backToDiscover}
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

function DiscoverCardBrowser({
  cards,
  visibleCount,
  onShowMore,
  subjectColors,
  headingClass,
  primaryColor,
  shadow,
}) {
  const visibleCards = cards.slice(0, visibleCount);
  const hasMore = visibleCount < cards.length;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <p
        className={`text-sm font-bold mb-4 ${headingClass} ${shadow ? 'drop-shadow-custom' : ''}`}
      >
        Showing {visibleCards.length} of {cards.length}
      </p>

      <div className="space-y-3">
        {visibleCards.map((card, i) => (
          <article
            key={card.id || i}
            className={`rounded-xl ${subjectColors.bgClass} background-shadow-new text-white overflow-hidden`}
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-white/20">
              <span className="text-xs font-bold uppercase tracking-wide text-white/80">
                Card {i + 1}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="px-4 py-4 sm:border-r sm:border-white/20">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Front
                </p>
                <CardFaceContent
                  mode={card.frontMode}
                  text={card.question}
                  imageUrl={null}
                />
              </div>
              <div className="px-4 py-4 bg-black/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Back
                </p>
                <CardFaceContent
                  mode={card.backMode}
                  text={card.answer}
                  imageUrl={card.image_url}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <BackgroundButton
            text={`Load more (${Math.min(VIEW_PAGE_SIZE, cards.length - visibleCount)})`}
            bgColor={`${primaryColor?.bgClass || 'bg-green-500'} ${
              primaryColor?.hoverClass || 'hover:bg-green-400'
            }`}
            onClick={onShowMore}
          />
        </div>
      )}
    </div>
  );
}

function CardFaceContent({ mode, text, imageUrl }) {
  const n = Number(mode);
  if (n === 2 || n === 3) {
    const src = imageUrl || (typeof text === 'string' && text.startsWith('http') ? text : null);
    if (src) {
      return <img src={src} alt="" className="max-h-44 rounded-lg object-contain bg-black/10" />;
    }
  }
  if (n === 1) {
    return <p className="text-lg sm:text-xl font-bold break-words leading-snug">{text}</p>;
  }
  return (
    <SafeMarkdown className="text-lg sm:text-xl font-bold break-words leading-snug [&_p]:m-0">
      {text || ''}
    </SafeMarkdown>
  );
}

export default DiscoverStudy;
