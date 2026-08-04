import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Compass, Search, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import LoadingSpinner from '../components/Elements/LoadingSpinner';
import PageEmptyState from '../components/Elements/PageEmptyState';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import CardArtOverlay from '../components/Elements/CardArtOverlay';
import { useUser } from '../UserContext';
import {
  listDiscoverSubjects,
  addToLibrary,
  clearDiscoverVote,
  fetchLibrarySubjectIds,
  setDiscoverVote,
} from '../components/Subject/SubjectManipulation';
import getColors from '../components/Functions/getColors';
import { getCardArt } from '../components/Functions/getCardArt';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';
import { toast } from '../components/Toast';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

const CATEGORY_ORDER = [
  'geography',
  'science',
  'languages',
  'history',
  'general',
  'other',
];

const CATEGORY_LABELS = {
  geography: 'Geography',
  science: 'Science',
  languages: 'Languages',
  history: 'History',
  general: 'General Knowledge',
  other: 'Other',
};

const VALID_CATEGORY_SET = new Set(CATEGORY_ORDER);

const parseCategoryParam = (value) => {
  if (!value) return 'all';
  const key = String(value).trim().toLowerCase();
  return VALID_CATEGORY_SET.has(key) ? key : 'all';
};

/**
 * Browse free published subjects. Guests can practice; signed-in users can add to library.
 */
function Discover() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, theme } = useUser();
  const { primaryColor, secondaryColor, textClass, shadow } = theme || {};
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(() =>
    parseCategoryParam(searchParams.get('category'))
  );
  const [libraryIds, setLibraryIds] = useState(() => new Set());
  const [addingId, setAddingId] = useState(null);
  const [votingId, setVotingId] = useState(null);

  const loadListings = useCallback(async (search, category) => {
    setLoading(true);
    const categoryFilter = category && category !== 'all' ? category : null;
    const data = await listDiscoverSubjects(search, categoryFilter);
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => loadListings(searchTerm, selectedCategory),
      searchTerm ? 250 : 0
    );
    return () => clearTimeout(t);
  }, [searchTerm, selectedCategory, loadListings]);

  useEffect(() => {
    const categoryFromUrl = parseCategoryParam(searchParams.get('category'));
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, selectedCategory]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    if (selectedCategory === 'all') nextParams.delete('category');
    else nextParams.set('category', selectedCategory);

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedCategory, searchParams, setSearchParams]);

  useEffect(() => {
    if (!user?.id) {
      setLibraryIds(new Set());
      return;
    }
    let cancelled = false;
    fetchLibrarySubjectIds(user.id).then((ids) => {
      if (!cancelled) setLibraryIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleAdd = async (subjectId) => {
    if (!user) {
      navigate('/?signup=1');
      return;
    }
    setAddingId(subjectId);
    const result = await addToLibrary(subjectId);
    setAddingId(null);
    if (!result.ok) {
      toast.error(result.error || 'Could not add subject');
      return;
    }
    setLibraryIds((prev) => new Set([...prev, subjectId, Number(subjectId)]));
    toast.success('Added to your dashboard');
  };

  const handleVote = async (subjectId, nextVote) => {
    if (!user) {
      navigate('/?signup=1');
      return;
    }

    const currentItem = listings.find((item) => item.id === subjectId);
    if (!currentItem) return;

    const previousVote = Number(currentItem.viewer_vote) || 0;
    const targetVote = previousVote === nextVote ? 0 : nextVote;

    setVotingId(subjectId);
    setListings((prev) =>
      prev.map((item) =>
        item.id === subjectId ? applyVoteState(item, targetVote) : item
      )
    );

    const result = targetVote === 0
      ? await clearDiscoverVote(subjectId)
      : await setDiscoverVote(subjectId, targetVote);

    setVotingId(null);

    if (!result.ok) {
      setListings((prev) =>
        prev.map((item) =>
          item.id === subjectId ? applyVoteState(item, previousVote) : item
        )
      );
      toast.error(result.error || 'Could not save vote');
      return;
    }
  };

  const showSections = selectedCategory === 'all' && !searchTerm.trim();

  const topRatedItems = useMemo(() => {
    if (!showSections) return [];
    return [...listings]
      .sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const upvoteDiff = (b.upvote_count || 0) - (a.upvote_count || 0);
        if (upvoteDiff !== 0) return upvoteDiff;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      })
      .slice(0, 12);
  }, [listings, showSections]);

  const sections = useMemo(() => {
    if (!showSections) return [];
    const byCategory = new Map();
    for (const item of listings) {
      const key = CATEGORY_ORDER.includes(item.category) ? item.category : 'other';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key).push(item);
    }
    return CATEGORY_ORDER.filter((key) => (byCategory.get(key) || []).length > 0).map(
      (key) => ({
        key,
        label: CATEGORY_LABELS[key],
        items: byCategory.get(key),
      })
    );
  }, [listings, showSections]);

  const chipCategories = useMemo(() => CATEGORY_ORDER, []);

  const discoverMeta = useMemo(() => {
    const categoryLabel =
      selectedCategory === 'all' ? 'All categories' : CATEGORY_LABELS[selectedCategory];
    const title =
      selectedCategory === 'all'
        ? 'Discover - Cardify | Free published flashcard subjects'
        : `${categoryLabel} Flashcards - Discover | Cardify`;
    const description =
      selectedCategory === 'all'
        ? 'Browse free published flashcard subjects on Cardify. Practice without an account, or sign in to save them to your dashboard.'
        : `Browse free ${categoryLabel.toLowerCase()} flashcard subjects on Cardify. Practice instantly or save decks to your dashboard.`;
    const canonical =
      selectedCategory === 'all'
        ? 'https://cardify.app/discover'
        : `https://cardify.app/discover?category=${selectedCategory}`;
    return { title, description, canonical };
  }, [selectedCategory]);

  const discoverStructuredData = useMemo(() => {
    const topItems = listings.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://cardify.app/discover/${item.id}`,
      name: item.name,
    }));
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: discoverMeta.title,
      description: discoverMeta.description,
      url: discoverMeta.canonical,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: topItems,
      },
    });
  }, [discoverMeta, listings]);

  const renderCard = (item) => {
    const isOwn = Boolean(user && item.publisher_id === user.id);
    const inLibrary = libraryIds.has(item.id) || libraryIds.has(Number(item.id));
    return (
      <DiscoverCard
        key={item.id}
        item={item}
        inLibrary={inLibrary}
        isOwn={isOwn}
        adding={addingId === item.id}
        voting={votingId === item.id}
        onPractice={() => navigate(`/discover/${item.id}`)}
        onView={() => navigate(`/discover/${item.id}?mode=view`)}
        onAdd={() => handleAdd(item.id)}
        onVote={(vote) => handleVote(item.id, vote)}
        signedIn={Boolean(user)}
      />
    );
  };

  const header = user ? (
    <TitleBar text="Discover" />
  ) : (
    <header className="flex items-center justify-between gap-4 px-4 mb-2 pt-2">
      <button
        type="button"
        className="flex items-center gap-3 min-w-0"
        onClick={() => navigate('/')}
      >
        <img src={CardifyLogo} alt="Cardify" className="h-9 w-auto shrink-0" />
        <div className="min-w-0 text-left">
          <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${textClass || 'text-white'}`}>
            Discover
          </p>
          <h1 className={`text-xl sm:text-2xl font-bold truncate ${textClass || 'text-white'}`}>
            Free subjects
          </h1>
        </div>
      </button>
      <BackgroundButton
        text="Sign in"
        bgColor={`${primaryColor?.bgClass || 'bg-green-500'} ${primaryColor?.hoverClass || 'hover:bg-green-400'}`}
        onClick={() => navigate('/')}
      />
    </header>
  );

  return (
    <div
      className="w-full min-h-[100lvh] relative bg-cover bg-center bg-no-repeat"
      style={{ ...getThemeBackgroundStyle(theme?.image) }}
    >
      <Helmet>
        <title>{discoverMeta.title}</title>
        <meta name="description" content={discoverMeta.description} />
        <meta property="og:title" content={discoverMeta.title} />
        <meta property="og:description" content={discoverMeta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={discoverMeta.canonical} />
        <meta property="og:image" content="https://cardify.app/logo512.png" />
        <meta property="og:image:alt" content="Cardify Discover flashcard marketplace" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={discoverMeta.title} />
        <meta name="twitter:description" content={discoverMeta.description} />
        <meta name="twitter:image" content="https://cardify.app/logo512.png" />
        <link rel="canonical" href={discoverMeta.canonical} />
        <script type="application/ld+json">{discoverStructuredData}</script>
      </Helmet>

      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ ...getThemeBackgroundStyle(theme?.image) }}
      />

      <div className="relative z-10 min-h-[100lvh] pb-20 px-1 sm:px-0">
        {header}

        <div className="px-4 mt-3 flex flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-24 h-24 rounded-full text-white mb-6 background-shadow-new ${
                secondaryColor?.bgClass || 'bg-orange-500'
              }`}
            >
              <Compass size={44} strokeWidth={2.6} aria-hidden="true" />
            </div>
            <p
              className={`text-3xl sm:text-4xl font-extrabold tracking-wide ${
                textClass || 'text-white'
              } ${shadow ? 'drop-shadow-custom' : ''}`}
            >
              Discover
            </p>

            <h2
              className={`mt-3 text-lg sm:text-xl font-semibold opacity-90 ${textClass || 'text-white'}`}
            >
              Marketplace for new subjects
            </h2>
            <p className={`mt-1 text-sm sm:text-base opacity-80 ${textClass || 'text-white'}`}>
              {user
                ? 'Search by topic and practice now. Save favorites to your dashboard.'
                : 'Search by topic and practice for free. Sign in to save subjects to your dashboard.'}
            </p>
          </div>

          <div className="w-full max-w-3xl mt-6">
            <form
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Discover…"
                className={`w-full h-12 pl-11 pr-4 rounded-full text-white font-medium
                  ${secondaryColor?.bgClass || 'bg-orange-500'}
                  background-shadow-new background-focus focus:outline-none placeholder:text-white/60`}
              />
            </form>
            <div className="mt-3">
              <HorizontalScrollRow className="flex gap-2 overflow-x-auto pb-1">
                <CategoryChip
                  label="All"
                  active={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  activeClass={primaryColor?.bgClass || 'bg-green-500'}
                  idleClass={secondaryColor?.bgClass || 'bg-orange-500'}
                  idleHoverClass={secondaryColor?.hoverClass || 'hover:bg-orange-400'}
                />
                {chipCategories.map((key) => (
                  <CategoryChip
                    key={key}
                    label={CATEGORY_LABELS[key]}
                    active={selectedCategory === key}
                    onClick={() => setSelectedCategory(key)}
                    activeClass={primaryColor?.bgClass || 'bg-green-500'}
                    idleClass={secondaryColor?.bgClass || 'bg-orange-500'}
                    idleHoverClass={secondaryColor?.hoverClass || 'hover:bg-orange-400'}
                  />
                ))}
              </HorizontalScrollRow>
            </div>
          </div>
        </div>

        <div className="px-5 sm:p-4 py-6">
          {loading ? (
            <LoadingSpinner text="Loading Discover…" />
          ) : listings.length === 0 ? (
            <PageEmptyState>
              <NoSelectionModal
                text={searchTerm.trim() ? 'No matching subjects' : 'No free subjects yet'}
                subtext={
                  searchTerm.trim()
                    ? 'Try a different search or category.'
                    : 'When creators publish subjects to Discover, they will show up here.'
                }
                text1={user ? 'Go to Dashboard' : 'Create a free account'}
                action1={() => navigate(user ? '/dashboard' : '/?signup=1')}
                icon={<Compass size={44} strokeWidth={2.5} />}
              />
            </PageEmptyState>
          ) : showSections ? (
            <div className="flex flex-col gap-8">
              {topRatedItems.length > 0 && (
                <section aria-labelledby="discover-top-rated">
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <div>
                      <h3
                        id="discover-top-rated"
                        className={`text-xl sm:text-2xl font-bold ${textClass || 'text-white'} ${
                          shadow ? 'drop-shadow-custom' : ''
                        }`}
                      >
                        Top rated
                      </h3>
                      <p className={`text-sm opacity-80 mt-1 ${textClass || 'text-white'}`}>
                        The most upvoted free subjects on Discover right now.
                      </p>
                    </div>
                  </div>
                  <HorizontalScrollRow className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                    {topRatedItems.map((item) => (
                      <div
                        key={`top-rated-${item.id}`}
                        className="w-[16.5rem] sm:w-72 shrink-0 snap-start"
                      >
                        {renderCard(item)}
                      </div>
                    ))}
                  </HorizontalScrollRow>
                </section>
              )}
              {sections.map((section) => (
                <section key={section.key} aria-labelledby={`discover-${section.key}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <h3
                      id={`discover-${section.key}`}
                      className={`text-xl sm:text-2xl font-bold ${textClass || 'text-white'} ${
                        shadow ? 'drop-shadow-custom' : ''
                      }`}
                    >
                      {section.label}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(section.key)}
                      className={`text-sm font-semibold opacity-80 hover:opacity-100 ${textClass || 'text-white'}`}
                    >
                      See all
                    </button>
                  </div>
                  <HorizontalScrollRow className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="w-[16.5rem] sm:w-72 shrink-0 snap-start"
                      >
                        {renderCard(item)}
                      </div>
                    ))}
                  </HorizontalScrollRow>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
              {listings.map((item) => renderCard(item))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
  activeClass,
  idleClass,
  idleHoverClass,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 h-9 px-4 rounded-full text-sm font-bold transition duration-200 background-shadow-new background-hover text-white
        ${active ? `${activeClass} opacity-100` : `${idleClass} ${idleHoverClass} opacity-85 hover:opacity-100`}
      `}
    >
      {label}
    </button>
  );
}

function HorizontalScrollRow({ children, className = '' }) {
  const rowRef = useRef(null);
  const [scrollHints, setScrollHints] = useState({ left: false, right: false });

  const computeStep = (el) => {
    if (!el) return 0;
    const first = el.children?.[0];
    const second = el.children?.[1];
    if (first && second && second instanceof HTMLElement && first instanceof HTMLElement) {
      // Difference in offsetLeft approximates “one card” worth of scrolling (incl gaps).
      return second.offsetLeft - first.offsetLeft;
    }
    if (first instanceof HTMLElement) return first.getBoundingClientRect().width;
    return el.clientWidth;
  };

  const updateHints = () => {
    const el = rowRef.current;
    if (!el) return;
    const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
    setScrollHints({
      left: el.scrollLeft > 10,
      right: remaining > 10,
    });
  };

  const scrollByOne = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const step = computeStep(el);
    const next = el.scrollLeft + dir * step;
    el.scrollTo({ left: next, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;

    updateHints();
    el.addEventListener('scroll', updateHints, { passive: true });
    window.addEventListener('resize', updateHints);

    return () => {
      el.removeEventListener('scroll', updateHints);
      window.removeEventListener('resize', updateHints);
    };
  }, [children]);

  return (
    <div className="relative">
      <div ref={rowRef} className={`${className} scrollbar-hide`}>
        {children}
      </div>
      {scrollHints.left && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollByOne(-1);
          }}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white text-[rgb(3,15,64)] flex items-center justify-center border-4 border-[rgb(3,15,64)] transition duration-150 hover:bg-slate-50"
        >
          <ChevronRight size={16} className="rotate-180" aria-hidden="true" />
        </button>
      )}
      {scrollHints.right && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollByOne(1);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white text-[rgb(3,15,64)] flex items-center justify-center border-4 border-[rgb(3,15,64)] transition duration-150 hover:bg-slate-50"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function applyVoteState(item, nextVote) {
  const prevVote = Number(item.viewer_vote) || 0;
  let upvoteCount = Number(item.upvote_count) || 0;
  let downvoteCount = Number(item.downvote_count) || 0;

  if (prevVote === 1) upvoteCount = Math.max(0, upvoteCount - 1);
  if (prevVote === -1) downvoteCount = Math.max(0, downvoteCount - 1);
  if (nextVote === 1) upvoteCount += 1;
  if (nextVote === -1) downvoteCount += 1;

  return {
    ...item,
    viewer_vote: nextVote || null,
    upvote_count: upvoteCount,
    downvote_count: downvoteCount,
    score: upvoteCount - downvoteCount,
  };
}

function DiscoverCard({
  item,
  inLibrary,
  isOwn,
  adding,
  voting,
  onPractice,
  onView,
  onAdd,
  onVote,
  signedIn,
}) {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const { profile } = useUser();
  const colors = useMemo(
    () => getColors([item.colourText, item.colourIntensity]),
    [item.colourText, item.colourIntensity]
  );
  const cardArt = useMemo(() => {
    const art = profile?.card_art ? getCardArt(profile.card_art) : { image: null };
    return art;
  }, [profile?.card_art]);
  const iconFilter = cardArt.image ? 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))' : 'none';
  const textShadow = cardArt.image ? 'drop-shadow-custom' : '';

  // Show Add on every non-owned listing (guests + signed-in). Own listings: Practice + View only.
  const showAddAction = !isOwn;
  const canAdd = showAddAction && (!signedIn || !inLibrary);
  const cardCount = item.flashcard_count || 0;
  const publisher = item.publisher_username ? `@${item.publisher_username}` : 'Anonymous';
  const statusNote = isOwn ? ' · Yours' : inLibrary ? ' · In library' : '';
  const score = Number(item.score) || 0;
  const viewerVote = Number(item.viewer_vote) || 0;

  return (
    <div
      className={`group relative mx-auto w-full min-h-44 sm:h-56 overflow-hidden ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow-new background-hover cursor-pointer transition duration-300`}
    >
      <CardArtOverlay image={cardArt.image} />
      <span
        className={`absolute top-2 left-3 z-10 text-xs font-bold uppercase tracking-wide text-white ${textShadow}`}
      >
        Free
      </span>
      <div className="absolute top-2 right-3 z-10">
        <div
          className="flex items-center rounded-full bg-black/25 backdrop-blur-sm text-white overflow-hidden
            w-[2.8rem] group-hover:w-[5.7rem] transition-all duration-300"
        >
          <div
            className="flex items-center gap-1 overflow-hidden
              max-w-0 opacity-0 group-hover:max-w-[3.0rem] group-hover:opacity-100
              transition-[max-width,opacity] duration-300"
          >
            <VoteBadgeButton
              tooltipText={viewerVote === 1 ? 'Remove upvote' : 'Upvote'}
              hoveredIcon={hoveredIcon}
              setHoveredIcon={setHoveredIcon}
              onClick={voting ? undefined : () => onVote(1)}
              active={viewerVote === 1}
              disabled={voting}
              icon={<ThumbsUp size={12} strokeWidth={2.6} />}
            />
            <VoteBadgeButton
              tooltipText={viewerVote === -1 ? 'Remove downvote' : 'Downvote'}
              hoveredIcon={hoveredIcon}
              setHoveredIcon={setHoveredIcon}
              onClick={voting ? undefined : () => onVote(-1)}
              active={viewerVote === -1}
              disabled={voting}
              icon={<ThumbsDown size={12} strokeWidth={2.6} />}
            />
          </div>

          <div className="shrink-0 ml-auto h-8 px-1 flex items-center gap-1.5">
            <TrendingUp size={13} />
            <span className={`text-xs font-bold ${textShadow}`}>
              {score > 0 ? `+${score}` : score}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 mb-1 w-full">
        <h1
          className={`ml-3 mr-2 text-2xl sm:text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 break-words line-clamp-2 hyphens-auto ${textShadow} sm:translate-y-8 sm:group-hover:-translate-y-3`}
        >
          {item.name}
        </h1>
        <p
          className={`ml-3 text-base sm:text-lg text-white font-bold transform transition-transform duration-300 break-words overflow-hidden text-ellipsis ${textShadow} sm:translate-y-8 sm:group-hover:-translate-y-3`}
        >
          {publisher}
          <span className="opacity-80">
            {' '}
            · {cardCount} {cardCount === 1 ? 'card' : 'cards'}
            {statusNote}
          </span>
        </p>

        <div className="flex ml-2 gap-4 opacity-1 transition duration-300 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <DiscoverActionButton
            tooltipText="Practice"
            hoveredIcon={hoveredIcon}
            setHoveredIcon={setHoveredIcon}
            onClick={onPractice}
            img={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-10"
                filter={iconFilter}
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <DiscoverActionButton
            tooltipText="View"
            hoveredIcon={hoveredIcon}
            setHoveredIcon={setHoveredIcon}
            onClick={onView}
            img={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-10"
                filter={iconFilter}
              >
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path
                  fillRule="evenodd"
                  d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          {showAddAction && (
            <DiscoverActionButton
              tooltipText={
                !signedIn
                  ? 'Add'
                  : inLibrary
                    ? 'In library'
                    : adding
                      ? 'Adding…'
                      : 'Add'
              }
              hoveredIcon={hoveredIcon}
              setHoveredIcon={setHoveredIcon}
              onClick={canAdd && !adding ? onAdd : undefined}
              img={
                inLibrary && signedIn ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10 opacity-80"
                    filter={iconFilter}
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`size-10 ${adding ? 'opacity-60' : ''}`}
                    filter={iconFilter}
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function VoteBadgeButton({
  icon,
  tooltipText,
  onClick,
  hoveredIcon,
  setHoveredIcon,
  active,
  disabled,
}) {
  const key = tooltipText.toLowerCase();
  const activate = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      aria-label={tooltipText}
      disabled={disabled}
      className={`relative h-5 w-5 rounded-full flex items-center justify-center transition-colors
        ${active ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'}
        ${disabled ? 'opacity-60 cursor-default' : ''}`}
      onMouseEnter={() => setHoveredIcon(key)}
      onMouseLeave={() => setHoveredIcon(null)}
      onClick={activate}
    >
      {icon}
      {hoveredIcon === key && (
        <div className="absolute -bottom-7 right-0 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100 whitespace-nowrap">
          {tooltipText}
        </div>
      )}
    </button>
  );
}

function DiscoverActionButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {
  const key = tooltipText.toLowerCase();
  const activate = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={tooltipText}
      className="relative text-white block items-center"
      onMouseEnter={() => setHoveredIcon(key)}
      onMouseLeave={() => setHoveredIcon(null)}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(e);
        }
      }}
    >
      {img}
      {hoveredIcon === key && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100 whitespace-nowrap">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

export default Discover;
