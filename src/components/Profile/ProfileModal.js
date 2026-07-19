import ReactDOM from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { getThemeAssets } from '../Functions/getTheme';
import { getCardArtAssets } from '../Functions/getCardArt';
import { saveProfile } from './ProfileManipulation';
import { getShares, fetchSubjects, removeShare, saveShare, fetchPendingShareInvites, respondShareInvite } from '../Subject/SubjectManipulation';
import { Cog, LogOut, Share2, Palette, Sparkles, Layers, X, Image as ImageIcon, Mail } from 'lucide-react';
import Modal from '../Modals/Modal';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

function assetBackground(url) {
    if (!url) return undefined;
    const value = String(url);
    if (value.startsWith('url(') || value.startsWith('linear') || value.startsWith('#')) {
        return value;
    }
    return `url(${url})`;
}

function GlassPanel({ isOpen, onClose, title, subtitle, icon, children, footer, wide = false }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 300);
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
            return;
        }
        setIsVisible(false);
        setIsClosing(false);
    }, [isOpen]);

    useBodyScrollLock(isVisible || isClosing);

    useEffect(() => {
        if (!isVisible) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-[60] p-0 sm:p-6 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={handleClose} />
            <div
                className={`relative w-full ${wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'} h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col
                    bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
                    sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
                    transform transition-all duration-300 ease-in-out
                    ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {icon}
                                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{title}</h2>
                            </div>
                            {subtitle && (
                                <p className="text-sm text-white/60">{subtitle}</p>
                            )}
                        </div>
                        <BackgroundButton
                            image={<X size={20} strokeWidth={3} />}
                            bgColor="bg-red-500 hover:bg-red-400"
                            onClick={handleClose}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
                    {children}
                </div>

                {footer && (
                    <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

function ProfileModal({ isOpen, onClose, logout }) {
    const { theme, profile, user, setProfile } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isSharesModalOpen, setIsSharesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUnlimitedProModalOpen, setIsUnlimitedProModalOpen] = useState(false);
    const [newFirstName, setNewFirstName] = useState('');
    const [shareToDelete, setShareToDelete] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [shares, setShares] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isCardArtModalOpen, setIsCardArtModalOpen] = useState(false);
    const themeAssets = getThemeAssets();
    const cardArtAssets = useMemo(() => getCardArtAssets(), []);
    const { color, secondaryColor } = theme;

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
        } else {
            setIsVisible(false);
            setIsClosing(false);
        }
    }, [isOpen]);

    useBodyScrollLock(isVisible || isClosing);

    useEffect(() => {
        if (theme && color) {
            document.documentElement.style.setProperty('--theme-border-color', color);
        }
    }, [theme, color]);

    const handleOnClose = (event) => {
        if (event) {
            event.stopPropagation();
        }
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const handleThemeSelect = async (themeName) => {
        try {
            const themeKey = themeName.toLowerCase().replaceAll(' ', '');
            const updated = await saveProfile(
                profile.id,
                profile.first_name,
                themeKey,
                profile.sort_preference,
                profile.card_art,
                profile.generation_count
            );
            if (updated) setProfile(updated);
            else setProfile({ ...profile, theme: themeKey });
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    };

    const handleCardArtSelect = async (cardArtName) => {
        try {
            const cardArtKey = cardArtName.toLowerCase();
            const updated = await saveProfile(
                profile.id,
                profile.first_name,
                profile.theme,
                profile.sort_preference,
                cardArtKey,
                profile.generation_count
            );
            if (updated) setProfile(updated);
            else setProfile({ ...profile, card_art: cardArtKey });
        } catch (error) {
            console.error('Error updating subject art:', error);
        }
    };

    const handleSharesClick = async () => {
        try {
            const sharesData = await getShares(profile.id);
            const subjectsData = await fetchSubjects(user, profile);

            const subjectMap = subjectsData.reduce((acc, subject) => {
                acc[subject.id] = subject.name;
                return acc;
            }, {});

            const sharesWithNames = sharesData.map(share => ({
                ...share,
                subjectName: subjectMap[share.subject_id] || 'Unknown Subject'
            }));

            setShares(sharesWithNames);
            setIsSharesModalOpen(true);
        } catch (error) {
            console.error('Error fetching shares:', error);
        }
    };

    const handleInboxClick = async () => {
        const invites = await fetchPendingShareInvites(user?.email);
        setPendingInvites(invites);
        setIsInboxOpen(true);
    };

    const handleInviteResponse = async (invite, accept) => {
        const ok = await respondShareInvite(invite, accept, profile.id);
        if (ok) {
            setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
        }
    };

    const groupedShares = shares.reduce((acc, share) => {
        const subjectName = share.subjectName;
        if (!acc[subjectName]) {
            acc[subjectName] = [];
        }
        acc[subjectName].push(share);
        return acc;
    }, {});

    const handleDeleteClick = (share) => {
        setShareToDelete(share);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (shareToDelete) {
            try {
                const success = await removeShare(shareToDelete.subject_id, shareToDelete.recipient_email);
                if (success) {
                    setShares(shares.filter(share =>
                        !(share.subject_id === shareToDelete.subject_id &&
                          share.recipient_email === shareToDelete.recipient_email)
                    ));
                }
            } catch (error) {
                console.error('Error removing share:', error);
            }
        }
        setIsDeleteModalOpen(false);
        setShareToDelete(null);
    };

    const handlePermissionChange = async (share, newPermission) => {
        try {
            const success = await saveShare(share.id, share.owner_id, share.subject_id, share.recipient_email, newPermission);
            if (success) {
                setShares(shares.map(s =>
                    s.id === share.id ? { ...s, permission: newPermission } : s
                ));
            }
        } catch (error) {
            console.error('Error updating permission:', error);
        }
        setActiveDropdown(null);
    };

    const sharesList = Object.entries(groupedShares).map(([subjectName, subjectShares]) => (
        <div key={subjectName}>
            <h3 className="text-base font-bold text-white mb-2 ml-0.5">{subjectName}</h3>
            <div className="space-y-2">
                {subjectShares.map((share) => (
                    <div
                        key={share.id}
                        className="flex justify-between items-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-3.5 py-3"
                    >
                        <span className="text-sm font-medium text-white/90 truncate min-w-0">
                            {share.recipient_email}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative permission-dropdown">
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === share.id ? null : share.id)}
                                    className="capitalize flex items-center font-semibold text-white px-3 py-1.5 rounded-full bg-blue-500 background-shadow-new background-hover"
                                >
                                    {share.permission}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                {activeDropdown === share.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePermissionChange(share, 'viewer');
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Viewer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePermissionChange(share, 'editor');
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Editor
                                        </button>
                                    </div>
                                )}
                            </div>
                            <BackgroundButton
                                image={<X size={16} strokeWidth={3} />}
                                bgColor="bg-red-500 hover:bg-red-400"
                                onClick={() => handleDeleteClick(share)}
                                wSizing="w-9"
                                hSizing="h-9"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.permission-dropdown')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    const handleEditClick = () => {
        setNewFirstName(profile.first_name);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            const updated = await saveProfile(
                profile.id,
                newFirstName,
                profile.theme,
                profile.sort_preference,
                profile.card_art,
                profile.generation_count
            );
            if (updated) setProfile(updated);
            else setProfile({ ...profile, first_name: newFirstName });
        } catch (error) {
            console.error('Error updating profile:', error);
        }
        setIsEditModalOpen(false);
    };

    if (!isVisible && !isClosing) return null;

    const cardLimit = profile.pro ? 500 : 100;
    const genLimit = profile.pro ? 60 : 20;
    const cardCount = profile.flashcard_count || 0;
    const genCount = profile.generation_count || 0;
    const currentThemeAsset = themeAssets.find(asset => asset.name.toLowerCase() === theme.name);
    const currentCardArt = cardArtAssets.find(asset => asset.name.toLowerCase() === profile.card_art);
    const initial = profile?.first_name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <>
            {ReactDOM.createPortal(
                <div
                    className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'opacity-100'
                    }`}
                    onClick={handleOnClose}
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleOnClose}
                    />

                    <div
                        className={`relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col
                            bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
                            sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
                            transform transition-all duration-300 ease-in-out
                            ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0 ${secondaryColor?.bgClass || 'bg-purple-500'}`}>
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                                            Hey, {profile.first_name}!
                                        </h2>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${profile.pro ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                                {profile.pro ? 'Pro' : 'Free'} plan
                                            </span>
                                            <span className="text-sm text-white/60 truncate">
                                                Your study HQ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <BackgroundButton
                                    image={<X size={20} strokeWidth={3} />}
                                    bgColor="bg-red-500 hover:bg-red-400"
                                    onClick={handleOnClose}
                                />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
                            {/* Usage */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers size={20} className="text-white/90" />
                                    <h3 className="text-lg font-bold text-white">Usage</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <UsageStat
                                        label="Flashcards"
                                        value={cardCount}
                                        max={cardLimit}
                                        barClass="bg-blue-400"
                                    />
                                    <UsageStat
                                        label="AI generations"
                                        value={genCount}
                                        max={genLimit}
                                        barClass="bg-purple-400"
                                    />
                                </div>
                            </section>

                            {/* Customisation */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette size={20} className="text-white/90" />
                                    <h3 className="text-lg font-bold text-white">Customise</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsThemeModalOpen(true)}
                                        className="text-left bg-white dark:bg-gray-700 rounded-2xl p-3 background-shadow-new background-hover cursor-pointer"
                                    >
                                        <div
                                            className="h-24 sm:h-28 w-full rounded-xl mb-2 bg-cover bg-center bg-gray-200 dark:bg-gray-600"
                                            style={{
                                                backgroundImage: currentThemeAsset?.url
                                                    ? (String(currentThemeAsset.url).startsWith('url(') || String(currentThemeAsset.url).startsWith('linear') || String(currentThemeAsset.url).startsWith('#')
                                                        ? currentThemeAsset.url
                                                        : `url(${currentThemeAsset.url})`)
                                                    : undefined,
                                            }}
                                        />
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                            {currentThemeAsset?.name || 'Default'}
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsCardArtModalOpen(true)}
                                        className="text-left bg-white dark:bg-gray-700 rounded-2xl p-3 background-shadow-new background-hover cursor-pointer"
                                    >
                                        <div
                                            className="h-24 sm:h-28 w-full rounded-xl mb-2 bg-cover bg-center bg-gray-200 dark:bg-gray-600"
                                            style={{
                                                backgroundImage: currentCardArt?.url ? `url(${currentCardArt.url})` : undefined,
                                            }}
                                        />
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Subject art</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                            {currentCardArt?.name || 'None'}
                                        </p>
                                    </button>
                                </div>
                            </section>

                            {/* Quick tip */}
                            <div className="flex items-start gap-3 text-white/80">
                                <Sparkles size={20} className="shrink-0 mt-0.5 text-yellow-300" />
                                <p className="text-sm font-medium leading-snug">
                                    Themes and subject art update across your whole study space. Tap a tile above to switch things up.
                                </p>
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <BackgroundButton
                                    text="Inbox"
                                    image={<Share2 size={18} />}
                                    flip
                                    bgColor="bg-indigo-500 hover:bg-indigo-400"
                                    wWidth="w-full"
                                    onClick={handleInboxClick}
                                />
                                <BackgroundButton
                                    text="Shares"
                                    image={<Share2 size={18} />}
                                    flip
                                    bgColor="bg-purple-500 hover:bg-purple-400"
                                    wWidth="w-full"
                                    onClick={handleSharesClick}
                                />
                                <BackgroundButton
                                    text="Settings"
                                    image={<Cog size={18} />}
                                    flip
                                    bgColor="bg-blue-500 hover:bg-blue-400"
                                    wWidth="w-full"
                                    onClick={handleEditClick}
                                />
                                <BackgroundButton
                                    text="Log out"
                                    image={<LogOut size={18} />}
                                    flip
                                    bgColor="bg-red-500 hover:bg-red-400"
                                    wWidth="w-full"
                                    onClick={logout}
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <GlassPanel
                isOpen={isSharesModalOpen}
                onClose={() => setIsSharesModalOpen(false)}
                title="Shares"
                subtitle="People you've shared subjects with"
                icon={<Share2 size={22} className="text-white/90 shrink-0" />}
                footer={
                    <div className="flex sm:justify-end">
                        <BackgroundButton
                            text="Done"
                            bgColor="bg-green-500 hover:bg-green-400"
                            wWidth="w-full sm:w-auto"
                            onClick={() => setIsSharesModalOpen(false)}
                        />
                    </div>
                }
            >
                {sharesList.length > 0 ? (
                    <div className="space-y-6">{sharesList}</div>
                ) : (
                    <div className="py-10 text-center">
                        <Share2 size={36} className="mx-auto mb-3 text-white/40" />
                        <p className="text-lg font-bold text-white">Nothing shared yet</p>
                        <p className="mt-2 text-sm text-white/60 max-w-sm mx-auto">
                            When you share a subject with a friend, they&apos;ll show up here so you can manage access.
                        </p>
                    </div>
                )}
            </GlassPanel>

            <GlassPanel
                isOpen={isInboxOpen}
                onClose={() => setIsInboxOpen(false)}
                title="Share inbox"
                subtitle="Pending invitations to study with others"
                icon={<Share2 size={22} className="text-white/90 shrink-0" />}
                footer={
                    <div className="flex sm:justify-end">
                        <BackgroundButton
                            text="Done"
                            bgColor="bg-green-500 hover:bg-green-400"
                            wWidth="w-full sm:w-auto"
                            onClick={() => setIsInboxOpen(false)}
                        />
                    </div>
                }
            >
                {pendingInvites.length > 0 ? (
                    <div className="space-y-3">
                        {pendingInvites.map((invite) => (
                            <div
                                key={invite.id}
                                className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                            >
                                <div>
                                    <p className="font-bold text-white">
                                        {invite.subjects?.name || `Subject #${invite.subject_id}`}
                                    </p>
                                    <p className="text-sm text-white/70">
                                        {invite.permission} access
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <BackgroundButton
                                        text="Accept"
                                        bgColor="bg-green-500 hover:bg-green-400"
                                        onClick={() => handleInviteResponse(invite, true)}
                                    />
                                    <BackgroundButton
                                        text="Decline"
                                        bgColor="bg-gray-600 hover:bg-gray-500"
                                        onClick={() => handleInviteResponse(invite, false)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-lg font-bold text-white">Inbox empty</p>
                        <p className="mt-2 text-sm text-white/60">No pending share invites.</p>
                    </div>
                )}
            </GlassPanel>

            <Modal
                isOpen={isDeleteModalOpen}
                onFirstAction={() => setIsDeleteModalOpen(false)}
                onSecondAction={handleConfirmDelete}
                text="Confirm Remove"
                mainText={`Are you sure you want to remove access for ${shareToDelete?.recipient_email}?`}
                firstActionText="Cancel"
                firstActionCol="bg-gray-500 hover:bg-gray-400"
                secondActionText="Remove"
                secondActionCol="bg-red-500 hover:bg-red-400"
            />

            <GlassPanel
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                title="Themes"
                subtitle="Pick a vibe for your study space"
                icon={<Palette size={22} className="text-white/90 shrink-0" />}
                wide
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {themeAssets.map((asset) => {
                        const selected = asset.name.toLowerCase() === theme.name;
                        return (
                            <button
                                type="button"
                                key={asset.name}
                                className={`text-left bg-white dark:bg-gray-700 rounded-2xl p-2.5 background-shadow-new background-hover cursor-pointer ${
                                    selected ? 'ring-4 ring-green-400' : ''
                                }`}
                                onClick={() => {
                                    handleThemeSelect(asset.name);
                                    setIsThemeModalOpen(false);
                                }}
                            >
                                <div
                                    className="h-24 sm:h-28 w-full rounded-xl mb-2 bg-cover bg-center bg-gray-200 dark:bg-gray-600"
                                    style={{ backgroundImage: assetBackground(asset.url) }}
                                />
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate px-0.5">
                                    {asset.name}
                                </p>
                                {selected && (
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 px-0.5">
                                        Current
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </GlassPanel>

            <GlassPanel
                isOpen={isCardArtModalOpen}
                onClose={() => setIsCardArtModalOpen(false)}
                title="Subject art"
                subtitle="Decorate your subject cards"
                icon={<ImageIcon size={22} className="text-white/90 shrink-0" />}
                wide
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {cardArtAssets.map((asset) => {
                        const selected = asset.name.toLowerCase() === (profile.card_art || 'none');
                        return (
                            <button
                                type="button"
                                key={asset.name}
                                className={`text-left bg-white dark:bg-gray-700 rounded-2xl p-2.5 background-shadow-new background-hover cursor-pointer ${
                                    selected ? 'ring-4 ring-purple-400' : ''
                                }`}
                                onClick={() => {
                                    handleCardArtSelect(asset.name);
                                    setIsCardArtModalOpen(false);
                                }}
                            >
                                <div
                                    className="h-24 sm:h-28 w-full rounded-xl mb-2 bg-cover bg-center bg-gray-100 dark:bg-gray-600 flex items-center justify-center"
                                    style={{ backgroundImage: asset.url ? `url(${asset.url})` : undefined }}
                                >
                                    {!asset.url && (
                                        <span className="text-sm font-bold text-gray-400">None</span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate px-0.5">
                                    {asset.name}
                                </p>
                                {selected && (
                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 px-0.5">
                                        Current
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </GlassPanel>

            <GlassPanel
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Settings"
                subtitle="Update your account details"
                icon={<Cog size={22} className="text-white/90 shrink-0" />}
                footer={
                    <div className="flex sm:justify-end">
                        <BackgroundButton
                            text="Save changes"
                            bgColor="bg-blue-500 hover:bg-blue-400"
                            wWidth="w-full sm:w-auto"
                            onClick={handleSaveEdit}
                        />
                    </div>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-bold text-white/90 mb-2 ml-1">
                            First name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            value={newFirstName}
                            onChange={(e) => setNewFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                                background-shadow-new background-focus focus:outline-none font-medium
                                placeholder:text-gray-400"
                            placeholder="Enter your first name"
                        />
                    </div>

                    <div>
                        <p className="text-sm font-bold text-white/90 mb-2 ml-1">Plan</p>
                        <p className="text-white font-bold mb-1">
                            You&apos;re on the {profile.pro ? 'Pro' : 'Free'} plan
                        </p>
                        <p className="text-sm text-white/60 leading-relaxed">
                            Cardify is in beta. Pro spots are limited — if you&apos;d like to upgrade, email{' '}
                            <a
                                href="mailto:hello@flashcardify.app"
                                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 font-semibold underline underline-offset-2"
                            >
                                <Mail size={14} />
                                hello@flashcardify.app
                            </a>
                            .
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-bold text-white/50 mb-2 ml-1">Danger zone</p>
                        <BackgroundButton
                            text="Delete account"
                            bgColor="bg-red-500 hover:bg-red-400"
                            onClick={() => {}}
                        />
                    </div>
                </div>
            </GlassPanel>

            <Modal
                isOpen={isUnlimitedProModalOpen}
                onFirstAction={() => setIsUnlimitedProModalOpen(false)}
                text="Unlimited Pro"
                mainText={
                    <div className="space-y-4">
                        <p className="text-gray-300">You have unlimited Pro access and do not require a payment method.</p>
                        <p className="text-gray-300">Enjoy all Pro features without any billing concerns!</p>
                    </div>
                }
                width="w-full sm:w-2/3 h-full sm:h-auto"
                firstActionText="Great!"
                firstActionCol="bg-green-500 hover:bg-green-400"
            />
        </>
    );
}

function UsageStat({ label, value, max, barClass }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="py-1">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-white/90">{label}</span>
                <span className="text-sm font-bold text-white/60">
                    {value}/{max}
                </span>
            </div>
            <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barClass} transition-all duration-300 rounded-full`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default ProfileModal;
