import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, Search } from 'lucide-react';
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
  fetchLibrarySubjectIds,
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

/**
 * Browse free published subjects. Guests can practice; signed-in users can add to library.
 */
function Discover() {
  const navigate = useNavigate();
  const { user, theme } = useUser();
  const { primaryColor, secondaryColor, textClass, shadow } = theme || {};
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [libraryIds, setLibraryIds] = useState(() => new Set());
  const [addingId, setAddingId] = useState(null);

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
  }, [user?.id, listings]);

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

  const showSections = selectedCategory === 'all' && !searchTerm.trim();

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

  const chipCategories = useMemo(() => {
    // Always offer the main taxonomy; only show Other when it has listings (or is selected)
    const present = new Set(listings.map((item) => item.category || 'other'));
    return CATEGORY_ORDER.filter(
      (key) =>
        key !== 'other' ||
        present.has('other') ||
        selectedCategory === 'other'
    );
  }, [listings, selectedCategory]);

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
        onPractice={() => navigate(`/discover/${item.id}`)}
        onView={() => navigate(`/discover/${item.id}?mode=view`)}
        onAdd={() => handleAdd(item.id)}
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
      className="w-screen min-h-[100lvh] relative bg-cover bg-center bg-no-repeat"
      style={{ ...getThemeBackgroundStyle(theme?.image) }}
    >
      <Helmet>
        <title>Discover - Cardify | Free published flashcard subjects</title>
        <meta
          name="description"
          content="Browse free published flashcard subjects on Cardify. Practice without an account, or sign in to save them to your dashboard."
        />
        <link rel="canonical" href="https://cardify.app/discover" />
      </Helmet>

      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ ...getThemeBackgroundStyle(theme?.image) }}
      />

      <div className="relative z-10 min-h-[100lvh] pb-20 px-1 sm:px-0">
        {header}

        <div className="px-4 mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2
              className={`text-2xl sm:text-3xl font-bold ${textClass || 'text-white'} ${
                shadow ? 'drop-shadow-custom' : ''
              }`}
            >
              Free published subjects
            </h2>
            <p className={`mt-1 text-sm sm:text-base opacity-80 ${textClass || 'text-white'}`}>
              {user
                ? 'Practice or view any listing — add ones you like to your dashboard.'
                : 'Practice for free — sign up if you want to save subjects to a dashboard.'}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Discover…"
              className={`w-full h-10 pl-10 pr-4 rounded-full text-white font-medium
                ${secondaryColor?.bgClass || 'bg-orange-500'}
                background-shadow-new background-focus focus:outline-none placeholder:text-white/60`}
            />
          </div>
        </div>

        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <CategoryChip
            label="All"
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            activeClass={primaryColor?.bgClass || 'bg-green-500'}
            idleClass={secondaryColor?.bgClass || 'bg-orange-500'}
          />
          {chipCategories.map((key) => (
            <CategoryChip
              key={key}
              label={CATEGORY_LABELS[key]}
              active={selectedCategory === key}
              onClick={() => setSelectedCategory(key)}
              activeClass={primaryColor?.bgClass || 'bg-green-500'}
              idleClass={secondaryColor?.bgClass || 'bg-orange-500'}
            />
          ))}
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
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="w-[16.5rem] sm:w-72 shrink-0 snap-start"
                      >
                        {renderCard(item)}
                      </div>
                    ))}
                  </div>
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

function CategoryChip({ label, active, onClick, activeClass, idleClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 h-9 px-4 rounded-full text-sm font-bold transition duration-200 background-shadow-new text-white
        ${active ? activeClass : `${idleClass} opacity-85 hover:opacity-100`}
      `}
    >
      {label}
    </button>
  );
}

function DiscoverCard({
  item,
  inLibrary,
  isOwn,
  adding,
  onPractice,
  onView,
  onAdd,
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
