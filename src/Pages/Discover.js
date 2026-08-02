import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, Search } from 'lucide-react';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import LoadingSpinner from '../components/Elements/LoadingSpinner';
import PageEmptyState from '../components/Elements/PageEmptyState';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import { useUser } from '../UserContext';
import {
  listDiscoverSubjects,
  addToLibrary,
  fetchLibrarySubjectIds,
} from '../components/Subject/SubjectManipulation';
import getColors from '../components/Functions/getColors';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';
import { toast } from '../components/Toast';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

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
  const [libraryIds, setLibraryIds] = useState(() => new Set());
  const [addingId, setAddingId] = useState(null);

  const loadListings = useCallback(async (search) => {
    setLoading(true);
    const data = await listDiscoverSubjects(search);
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadListings(searchTerm), searchTerm ? 250 : 0);
    return () => clearTimeout(t);
  }, [searchTerm, loadListings]);

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
    setLibraryIds((prev) => new Set([...prev, subjectId]));
    toast.success('Added to your dashboard');
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
                ? 'Practice any listing, or add it to your dashboard.'
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

        <div className="px-4 py-6">
          {loading ? (
            <LoadingSpinner text="Loading Discover…" />
          ) : listings.length === 0 ? (
            <PageEmptyState>
              <NoSelectionModal
                text="No free subjects yet"
                subtext="When creators publish subjects to Discover, they will show up here."
                text1={user ? 'Go to Dashboard' : 'Create a free account'}
                action1={() => navigate(user ? '/dashboard' : '/?signup=1')}
                icon={<Compass size={44} strokeWidth={2.5} />}
              />
            </PageEmptyState>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((item) => {
                const isOwn = Boolean(user && item.publisher_id === user.id);
                return (
                <DiscoverCard
                  key={item.id}
                  item={item}
                  inLibrary={isOwn || libraryIds.has(item.id)}
                  adding={addingId === item.id}
                  onPractice={() => navigate(`/discover/${item.id}`)}
                  onAdd={() => handleAdd(item.id)}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  signedIn={Boolean(user)}
                  ownLabel={isOwn}
                />
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiscoverCard({
  item,
  inLibrary,
  adding,
  onPractice,
  onAdd,
  primaryColor,
  secondaryColor,
  signedIn,
  ownLabel,
}) {
  const colors = useMemo(
    () => getColors([item.colourText, item.colourIntensity]),
    [item.colourText, item.colourIntensity]
  );

  return (
    <div
      className={`rounded-xl ${colors.bgClass} background-shadow-new p-4 flex flex-col min-h-44 text-white`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold leading-tight line-clamp-2">{item.name}</h3>
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide rounded-full bg-white/20 px-2 py-0.5">
          Free
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold opacity-90">
        {item.publisher_username ? `@${item.publisher_username}` : 'Anonymous'}
        <span className="opacity-70"> · </span>
        {item.flashcard_count || 0} {(item.flashcard_count || 0) === 1 ? 'card' : 'cards'}
      </p>
      {item.description ? (
        <p className="mt-2 text-sm opacity-85 line-clamp-3 flex-1">{item.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <BackgroundButton
          text="Practice"
          bgColor={`${primaryColor?.bgClass || 'bg-green-500'} ${
            primaryColor?.hoverClass || 'hover:bg-green-400'
          }`}
          wWidth="w-full sm:w-auto"
          onClick={onPractice}
        />
        {inLibrary ? (
          <BackgroundButton
            text={ownLabel ? 'Yours' : 'In library'}
            bgColor="bg-gray-500"
            wWidth="w-full sm:w-auto"
            disabled
          />
        ) : (
          <BackgroundButton
            text={signedIn ? 'Add' : 'Sign up to save'}
            bgColor={`${secondaryColor?.bgClass || 'bg-orange-500'} ${
              secondaryColor?.hoverClass || 'hover:bg-orange-400'
            }`}
            wWidth="w-full sm:w-auto"
            disabled={adding}
            onClick={onAdd}
          />
        )}
      </div>
    </div>
  );
}

export default Discover;
