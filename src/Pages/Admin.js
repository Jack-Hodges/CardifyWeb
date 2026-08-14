import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Crown, Infinity as InfinityIcon, RefreshCw, RotateCcw, Search, Shield } from 'lucide-react';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import LoadingSpinner from '../components/Elements/LoadingSpinner';
import ConfirmModal from '../components/Modals/ConfirmModal';
import GlassPanel from '../components/Modals/GlassPanel';
import ProfileAvatar from '../components/Profile/ProfileAvatar';
import { useUser } from '../UserContext';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';
import { toast } from '../components/Toast';
import {
  fetchAdminOverview,
  listAdminUserSubjects,
  recalcAdminFlashcardCount,
  resetAdminGeneration,
  searchAdminUsers,
  unpublishAdminSubject,
  updateAdminUser,
} from './adminApi';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDay(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatJoined(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fillSignupDays(rows) {
  const byDay = new Map((rows || []).map((row) => [String(row.day).slice(0, 10), Number(row.count) || 0]));
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, '0'),
      String(day.getDate()).padStart(2, '0'),
    ].join('-');
    days.push({ day: key, count: byDay.get(key) || 0 });
  }
  return days;
}

function planLabel(person) {
  if (person?.unlimited) return 'Unlimited';
  if (person?.pro) return 'Pro';
  return 'Free';
}

function UserCard({ person, theme, onClick }) {
  const cardCount = Number(person.flashcard_count) || 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${rowColor(person, theme)} background-shadow-new background-hover w-full text-white text-left font-bold rounded-xl px-2.5 py-2 flex items-center gap-2.5`}
    >
      <ProfileAvatar
        avatarUrl={person.avatar_url}
        firstName={person.first_name}
        size="sm"
        fallbackBgClass="bg-black/25"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-base sm:text-lg truncate">{person.first_name || 'Unnamed'}</p>
          {person.admin ? <Shield size={14} className="shrink-0 opacity-90" /> : null}
        </div>
        <p className="text-xs sm:text-sm font-semibold opacity-90 truncate">
          {person.username ? `@${person.username}` : 'No username'} · {formatNumber(cardCount)} {cardCount === 1 ? 'card' : 'cards'}
        </p>
      </div>
      <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20">
        {planLabel(person)}
      </span>
    </button>
  );
}

const PAGE_SIZE = 24;

const FLAG_META = {
  pro: {
    label: 'Pro',
    titleOn: 'Give Pro?',
    titleOff: 'Remove Pro?',
    messageOn: 'They’ll get the Pro card and AI generation limits.',
    messageOff: 'They’ll go back to the Free plan limits.',
    confirmOn: 'Give Pro',
    confirmOff: 'Remove Pro',
    confirmColor: 'bg-yellow-500 hover:bg-yellow-400',
    icon: <Crown />,
  },
  unlimited: {
    label: 'Unlimited',
    titleOn: 'Give Unlimited?',
    titleOff: 'Remove Unlimited?',
    messageOn: 'They’ll have Pro access without a payment method.',
    messageOff: 'Unlimited access will be turned off.',
    confirmOn: 'Give Unlimited',
    confirmOff: 'Remove Unlimited',
    confirmColor: 'bg-orange-500 hover:bg-orange-400',
    icon: <InfinityIcon />,
  },
  admin: {
    label: 'Admin',
    titleOn: 'Give admin access?',
    titleOff: 'Remove admin access?',
    messageOn: 'They’ll see the Admin page and can change other users.',
    messageOff: 'They will lose the Admin page.',
    confirmOn: 'Give admin',
    confirmOff: 'Remove admin',
    confirmColor: 'bg-blue-500 hover:bg-blue-400',
    icon: <Shield />,
  },
};

function rowColor(person, theme) {
  if (person?.unlimited) return theme?.tertiaryColor?.bgClass || 'bg-orange-500';
  if (person?.pro) return 'bg-yellow-500';
  if (person?.admin) return 'bg-blue-500';
  return theme?.primaryColor?.bgClass || 'bg-green-500';
}

function Admin() {
  const navigate = useNavigate();
  const { user, loading: userLoading, profile, setProfile, theme } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, textClass, shadow } = theme || {};
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [subjectsByUser, setSubjectsByUser] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);

  const statTiles = useMemo(() => {
    if (!stats) return [];
    const colors = [primaryColor, secondaryColor, tertiaryColor];
    return [
      { label: 'Users', value: formatNumber(stats.users_total), hint: `${formatNumber(stats.users_pro)} Pro · ${formatNumber(stats.users_admin)} admin`, color: colors[0] },
      { label: 'New today', value: formatNumber(stats.users_today), hint: `${formatNumber(stats.users_7d)} this week`, color: colors[1] },
      { label: 'This month', value: formatNumber(stats.users_30d), hint: 'New accounts', color: colors[2] },
      { label: 'Live cards', value: formatNumber(stats.flashcards_live), hint: `${formatNumber(stats.subjects_live)} subjects`, color: colors[0] },
      { label: 'Discover', value: formatNumber(stats.listings), hint: 'Published listings', color: colors[1] },
      { label: 'Sessions', value: formatNumber(stats.sessions_7d), hint: 'Last 7 days', color: colors[2] },
    ];
  }, [stats, primaryColor, secondaryColor, tertiaryColor]);

  const signupDays = useMemo(() => fillSignupDays(stats?.signups_by_day), [stats]);
  const maxSignups = Math.max(1, ...signupDays.map((row) => row.count));

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    if (profile && !profile.admin) {
      navigate('/home');
    }
  }, [user, userLoading, profile, navigate]);

  const loadOverview = useCallback(async () => {
    const data = await fetchAdminOverview();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async (term, pageIndex = 0) => {
    setUsersLoading(true);
    try {
      const data = await searchAdminUsers(term, {
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
      });
      setUsers(data?.users || []);
      setUserTotal(Number(data?.total) || 0);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.admin) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadOverview()
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load admin data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.admin, loadOverview]);

  useEffect(() => {
    if (!profile?.admin) return undefined;
    const handle = setTimeout(() => {
      loadUsers(searchTerm, page).catch((err) => toast.error(err.message || 'Search failed'));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm, page, profile?.admin, loadUsers]);

  const patchUser = (updated) => {
    if (!updated?.id) return;
    setUsers((current) => current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
    setSelectedPerson((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
    if (updated.id === profile?.id) {
      setProfile((current) => (current ? { ...current, ...updated } : current));
    }
  };

  const runUserAction = async (person, action) => {
    setBusyId(person.id);
    try {
      const result = await action();
      patchUser({ id: person.id, ...result });
      toast.success('Updated');
      loadOverview().catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not update user');
    } finally {
      setBusyId(null);
    }
  };

  const openUser = async (person) => {
    setSelectedPerson(person);
    if (subjectsByUser[person.id]) return;
    try {
      const subjects = await listAdminUserSubjects(person.id);
      setSubjectsByUser((current) => ({ ...current, [person.id]: subjects || [] }));
    } catch (err) {
      toast.error(err.message || 'Could not load subjects');
    }
  };

  const requestFlagChange = (person, flag) => {
    if (flag === 'admin' && person.id === profile.id) return;
    setConfirmAction({ person, flag, enable: !person[flag] });
  };

  const applyFlagChange = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    const { person, flag, enable } = action;
    runUserAction(person, () => updateAdminUser(person.id, { [flag]: enable }));
  };

  const handleUnpublish = async (person, subject) => {
    setBusyId(`${person.id}:${subject.id}`);
    try {
      await unpublishAdminSubject(subject.id);
      setSubjectsByUser((current) => ({
        ...current,
        [person.id]: (current[person.id] || []).map((row) =>
          row.id === subject.id ? { ...row, published: false, listed: false } : row
        ),
      }));
      toast.success(`Unpublished ${subject.name}`);
      loadOverview().catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not unpublish');
    } finally {
      setBusyId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(userTotal / PAGE_SIZE));
  const rangeStart = userTotal === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(userTotal, (page + 1) * PAGE_SIZE);
  const confirmMeta = confirmAction ? FLAG_META[confirmAction.flag] : null;
  const confirmName = confirmAction?.person?.first_name || confirmAction?.person?.username || 'this user';

  if (userLoading || (user && !profile)) {
    return (
      <div className="w-screen min-h-[100lvh] relative bg-cover bg-center bg-no-repeat" style={{ ...getThemeBackgroundStyle(theme?.image) }}>
        <TitleBar text="Admin" />
        <LoadingSpinner text="Loading admin…" />
      </div>
    );
  }

  if (!user || !profile?.admin) return null;

  return (
    <div className="w-screen min-h-[100lvh] relative bg-cover bg-center bg-no-repeat" style={{ ...getThemeBackgroundStyle(theme?.image) }}>
      <Helmet>
        <title>Admin - Cardify</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0" style={{ ...getThemeBackgroundStyle(theme?.image) }} />
      <div className={`${shadow ? 'fixed top-0 left-0 w-full h-2/5 bg-gradient-to-b from-[rgba(0,0,0,0.2)] to-transparent z-5 pointer-events-none' : ''}`} />

      <div className="relative z-10 min-h-[100lvh] pb-20">
        <TitleBar text="Admin" />

        <div className={`text-3xl font-bold ${textClass || 'text-gray-700 dark:text-gray-200'}`}>
          <div className="mx-5">
            <p className={`text-4xl sm:text-5xl font-bold ${shadow ? 'drop-shadow-custom' : ''}`}>
              Admin HQ
            </p>
            <p className={`mt-1 text-base sm:text-lg font-semibold opacity-90 ${shadow ? 'drop-shadow-custom' : ''}`}>
              Search users, change plans, and manage Discover
            </p>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading stats…" />
          ) : error ? (
            <div className="mx-5 mt-6 rounded-xl bg-red-500 text-white p-4 background-shadow-new text-base">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mx-5 mt-6">
                {statTiles.map((tile) => (
                  <div
                    key={tile.label}
                    className={`rounded-xl p-4 text-white background-shadow-new ${tile.color?.bgClass || 'bg-green-500'}`}
                  >
                    <p className="text-sm font-bold opacity-90">{tile.label}</p>
                    <p className="text-3xl sm:text-4xl font-bold leading-tight">{tile.value}</p>
                    <p className="text-sm font-semibold opacity-90 mt-1">{tile.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mx-5 mt-6">
                <p className={`mb-3 ${shadow ? 'drop-shadow-custom' : ''}`}>Signups · 14 days</p>
                <div className={`rounded-xl p-4 text-white background-shadow-new ${secondaryColor?.bgClass || 'bg-purple-500'}`}>
                  <div className="flex items-end gap-1.5 h-24">
                    {signupDays.map((row) => (
                      <div key={row.day} className="flex-1 h-full flex items-end" title={`${formatDay(row.day)}: ${row.count}`}>
                        <div
                          className="w-full rounded-t-md bg-white/85"
                          style={{ height: `${Math.max(8, (row.count / maxSignups) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-bold text-white/80">
                    <span>{formatDay(signupDays[0]?.day)}</span>
                    <span>{formatDay(signupDays[signupDays.length - 1]?.day)}</span>
                  </div>
                </div>
              </div>

              <div className="mx-5 mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className={shadow ? 'drop-shadow-custom' : ''}>
                    Users
                    <span className="ml-2 text-lg opacity-80">{formatNumber(userTotal)}</span>
                  </p>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                      }}
                      placeholder="Search name or username"
                      className={`h-10 pl-10 pr-4 w-full rounded-full text-white text-base font-semibold placeholder-white/70 focus:outline-none background-shadow-new background-focus ${
                        secondaryColor ? `${secondaryColor.bgClass}` : 'bg-purple-500'
                      }`}
                    />
                  </div>
                </div>

                {usersLoading && users.length === 0 ? (
                  <LoadingSpinner text="Loading users…" />
                ) : users.length === 0 ? (
                  <p className={`text-lg font-semibold ${shadow ? 'drop-shadow-custom' : ''}`}>No users match that search.</p>
                ) : (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 ${usersLoading ? 'opacity-70' : ''}`}>
                    {users.map((person) => (
                      <UserCard
                        key={person.id}
                        person={person}
                        theme={theme}
                        onClick={() => openUser(person)}
                      />
                    ))}
                  </div>
                )}

                {userTotal > 0 ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className={`text-sm sm:text-base font-semibold ${shadow ? 'drop-shadow-custom' : ''}`}>
                      {rangeStart}–{rangeEnd} of {formatNumber(userTotal)}
                    </p>
                    <div className="flex items-center gap-2">
                      <BackgroundButton
                        image={<ChevronLeft size={20} />}
                        disabled={page <= 0 || usersLoading}
                        bgColor={`${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || 'hover:bg-purple-400'}`}
                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                      />
                      <span className={`text-sm font-bold ${shadow ? 'drop-shadow-custom' : ''}`}>
                        {page + 1}/{pageCount}
                      </span>
                      <BackgroundButton
                        image={<ChevronRight size={20} />}
                        disabled={page >= pageCount - 1 || usersLoading}
                        bgColor={`${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || 'hover:bg-purple-400'}`}
                        onClick={() => setPage((current) => current + 1)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <GlassPanel
        isOpen={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson?.first_name || 'User'}
        subtitle={selectedPerson?.username ? `@${selectedPerson.username}` : 'No username'}
        icon={
          selectedPerson ? (
            <ProfileAvatar
              avatarUrl={selectedPerson.avatar_url}
              firstName={selectedPerson.first_name}
              size="sm"
              fallbackBgClass={secondaryColor?.bgClass || 'bg-purple-500'}
            />
          ) : null
        }
      >
        {selectedPerson ? (
          <div className="space-y-5 text-white">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Cards', value: formatNumber(selectedPerson.flashcard_count) },
                { label: 'Gens today', value: formatNumber(selectedPerson.generation_count) },
                { label: 'Joined', value: formatJoined(selectedPerson.created_at) },
              ].map((tile) => (
                <div key={tile.label} className="rounded-xl bg-white/10 border border-white/15 px-3 py-3">
                  <p className="text-xs font-bold text-white/70">{tile.label}</p>
                  <p className="text-lg font-bold leading-tight mt-1 break-words">{tile.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-bold text-white/70 mb-2">Access</p>
              <div className="flex flex-wrap gap-2">
                <BackgroundButton
                  text="Pro"
                  image={<Crown size={16} />}
                  flip
                  disabled={busyId === selectedPerson.id}
                  bgColor={selectedPerson.pro ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-500 hover:bg-gray-400'}
                  onClick={() => requestFlagChange(selectedPerson, 'pro')}
                />
                <BackgroundButton
                  text="Unlimited"
                  image={<InfinityIcon size={16} />}
                  flip
                  disabled={busyId === selectedPerson.id}
                  bgColor={selectedPerson.unlimited ? 'bg-orange-500 hover:bg-orange-400' : 'bg-gray-500 hover:bg-gray-400'}
                  onClick={() => requestFlagChange(selectedPerson, 'unlimited')}
                />
                <BackgroundButton
                  text="Admin"
                  image={<Shield size={16} />}
                  flip
                  disabled={busyId === selectedPerson.id || selectedPerson.id === profile.id}
                  bgColor={selectedPerson.admin ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-500 hover:bg-gray-400'}
                  onClick={() => requestFlagChange(selectedPerson, 'admin')}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white/70 mb-2">Tools</p>
              <div className="flex flex-wrap gap-2">
                <BackgroundButton
                  text="Reset gens"
                  image={<RotateCcw size={16} />}
                  flip
                  disabled={busyId === selectedPerson.id}
                  bgColor={`${tertiaryColor?.bgClass || 'bg-orange-500'} ${tertiaryColor?.hoverClass || 'hover:bg-orange-400'}`}
                  onClick={() => runUserAction(selectedPerson, () => resetAdminGeneration(selectedPerson.id))}
                />
                <BackgroundButton
                  text="Sync cards"
                  image={<RefreshCw size={16} />}
                  flip
                  disabled={busyId === selectedPerson.id}
                  bgColor={`${primaryColor?.bgClass || 'bg-green-500'} ${primaryColor?.hoverClass || 'hover:bg-green-400'}`}
                  onClick={() => runUserAction(selectedPerson, () => recalcAdminFlashcardCount(selectedPerson.id))}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white/70 mb-2">Subjects</p>
              <div className="space-y-2">
                {(subjectsByUser[selectedPerson.id] || []).length === 0 ? (
                  <p className="text-sm font-semibold text-white/60">No subjects</p>
                ) : (
                  (subjectsByUser[selectedPerson.id] || []).map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-bold truncate">{subject.name}</p>
                        <p className="text-xs font-semibold text-white/70">
                          {formatNumber(subject.flashcard_count)} cards
                          {subject.listed ? ' · On Discover' : ''}
                          {subject.published ? ' · Published' : ''}
                          {subject.deleted ? ' · Deleted' : ''}
                        </p>
                      </div>
                      {(subject.listed || subject.published) && !subject.deleted ? (
                        <BackgroundButton
                          text="Unpublish"
                          disabled={busyId === `${selectedPerson.id}:${subject.id}`}
                          bgColor="bg-red-500 hover:bg-red-400"
                          onClick={() => handleUnpublish(selectedPerson, subject)}
                        />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </GlassPanel>

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.enable ? confirmMeta?.titleOn : confirmMeta?.titleOff}
        message={
          confirmMeta
            ? `${confirmAction?.enable ? confirmMeta.messageOn : confirmMeta.messageOff} This is for ${confirmName}.`
            : ''
        }
        icon={confirmMeta?.icon}
        confirmText={confirmAction?.enable ? confirmMeta?.confirmOn : confirmMeta?.confirmOff}
        confirmColor={confirmAction?.enable ? confirmMeta?.confirmColor : 'bg-red-500 hover:bg-red-400'}
        onConfirm={applyFlagChange}
      />
    </div>
  );
}

export default Admin;
