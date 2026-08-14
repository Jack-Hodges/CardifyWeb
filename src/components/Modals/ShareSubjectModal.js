import { useState, useEffect } from 'react';
import { Share2, Mail, Link2, X, Compass } from 'lucide-react';
import GlassPanel from './GlassPanel';
import BackgroundButton from '../Elements/BackgroundButton';
import ConfirmModal from './ConfirmModal';
import { useUser } from '../../UserContext';
import {
  saveShare,
  removeShare,
  createShareInvite,
  createOrGetPublicLink,
  revokePublicLink,
  getShares,
  fetchPublicLink,
  fetchListing,
  publishToDiscover,
  unpublishFromDiscover,
} from '../Subject/SubjectManipulation';
import { toast } from '../Toast';
import { unlockBadge } from '../Study/xp';

/**
 * Invite collaborators + public study link + Discover publish for a subject you own.
 */
function ShareSubjectModal({ isOpen, onClose, subject }) {
  const { profile, setProfile, theme } = useUser();
  const { secondaryColor } = theme || {};
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [publicLink, setPublicLink] = useState(null);
  const [listing, setListing] = useState(null);
  const [discoverDescription, setDiscoverDescription] = useState('');
  const [subjectShares, setSubjectShares] = useState([]);
  const [activeShareDropdown, setActiveShareDropdown] = useState(null);
  const [shareToRemove, setShareToRemove] = useState(null);
  const [discoverBusy, setDiscoverBusy] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile?.id || !subject?.id) return;

    const loadShareData = async () => {
      const allShares = await getShares(profile.id);
      setSubjectShares(allShares.filter((share) => share.subject_id === subject.id));
      const link = await fetchPublicLink(subject.id, profile.id);
      setPublicLink(link);
      const existingListing = await fetchListing(subject.id, profile.id);
      setListing(existingListing);
      setDiscoverDescription(existingListing?.description || '');
    };

    loadShareData();
  }, [isOpen, profile?.id, subject?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (activeShareDropdown && !event.target.closest('.share-permission-dropdown')) {
        setActiveShareDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeShareDropdown, isOpen]);

  const handleClose = () => {
    setShareEmail('');
    setShareRole('viewer');
    setActiveShareDropdown(null);
    setPublicLink(null);
    setListing(null);
    setDiscoverDescription('');
    setShareToRemove(null);
    onClose();
  };

  const refreshSubjectShares = async () => {
    if (!profile?.id || !subject?.id) return;
    const allShares = await getShares(profile.id);
    setSubjectShares(allShares.filter((share) => share.subject_id === subject.id));
  };

  const handleShareSubmit = async () => {
    if (!shareEmail || !profile?.id || !subject?.id) return;

    const invite = await createShareInvite(profile.id, subject.id, shareEmail, shareRole);
    const success = await saveShare(null, profile.id, subject.id, shareEmail, shareRole);
    if (invite || success) {
      setShareEmail('');
      setShareRole('viewer');
      await refreshSubjectShares();
      toast.success('Invite sent');
      unlockBadge(profile, setProfile, 'first_share');
    } else {
      toast.error('Could not send invite');
    }
  };

  const handleSharePermissionChange = async (share, newPermission) => {
    const success = await saveShare(
      share.id,
      share.owner_id,
      share.subject_id,
      share.recipient_email,
      newPermission
    );
    if (success) {
      setSubjectShares((current) =>
        current.map((item) =>
          item.id === share.id ? { ...item, permission: newPermission } : item
        )
      );
    }
    setActiveShareDropdown(null);
  };

  const handleConfirmRemoveShare = async () => {
    if (!shareToRemove) return;
    const success = await removeShare(shareToRemove.subject_id, shareToRemove.recipient_email);
    if (success) {
      setSubjectShares((current) => current.filter((item) => item.id !== shareToRemove.id));
      toast.success('Access removed');
    }
    setShareToRemove(null);
  };

  const handleMakePublicLink = async () => {
    const link = await createOrGetPublicLink(subject.id, profile.id);
    if (!link) {
      toast.error('Could not create public link');
      return;
    }
    setPublicLink(link);
    toast.success('Public link created');
  };

  const handleCopyPublicLink = async () => {
    if (!publicLink?.token) return;
    const url = `${window.location.origin}/study/${publicLink.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public study link copied');
    } catch {
      toast.info(url);
    }
  };

  const handleRevokePublicLink = async () => {
    if (!publicLink?.id) return;
    const success = await revokePublicLink(publicLink.id);
    if (!success) {
      toast.error('Could not revoke public link');
      return;
    }
    setPublicLink(null);
    toast.success('Public link revoked');
  };

  const isPublished = Boolean(listing?.published_at);

  const handlePublishDiscover = async () => {
    if (!profile?.id || !subject?.id) return;
    if (!profile.username) {
      toast.error('Set a unique username in Profile settings before publishing to Discover');
      return;
    }
    setDiscoverBusy(true);
    const data = await publishToDiscover(subject.id, profile.id, {
      description: discoverDescription,
      pricing: 'free',
      priceCents: 0,
    });
    setDiscoverBusy(false);
    if (!data) {
      toast.error('Could not publish to Discover');
      return;
    }
    setListing(data);
    toast.success('Published to Discover');
    unlockBadge(profile, setProfile, 'publisher');
  };

  const handleUnpublishDiscover = async () => {
    if (!profile?.id || !subject?.id) return;
    setDiscoverBusy(true);
    const success = await unpublishFromDiscover(subject.id, profile.id);
    setDiscoverBusy(false);
    if (!success) {
      toast.error('Could not unpublish');
      return;
    }
    setListing((prev) => (prev ? { ...prev, published_at: null } : prev));
    toast.success('Removed from Discover');
  };

  if (!subject) return null;

  return (
    <>
      <GlassPanel
        isOpen={isOpen}
        onClose={handleClose}
        title="Share subject"
        subtitle={subject?.name}
        icon={<Share2 size={22} className="text-white/90 shrink-0" />}
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <BackgroundButton
              text="Cancel"
              bgColor="bg-gray-600 hover:bg-gray-500"
              wWidth="w-full sm:w-auto"
              onClick={handleClose}
            />
            <BackgroundButton
              text="Send invite"
              image={<Mail size={18} />}
              flip
              bgColor={shareEmail ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-400'}
              wWidth="w-full sm:w-auto"
              disabled={!shareEmail}
              onClick={handleShareSubmit}
            />
          </div>
        }
      >
        <div className="space-y-6">
          <section>
            <label htmlFor="share-email" className="block text-sm font-bold text-white/90 mb-2 ml-1">
              Invite by email
            </label>
            <input
              id="share-email"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="friend@example.com"
              className={`w-full px-4 py-3 rounded-full text-white
                ${secondaryColor?.bgClass || 'bg-purple-500'}
                background-shadow-new background-focus focus:outline-none font-medium
                placeholder:text-white/60`}
            />

            <p className="text-sm font-bold text-white/90 mb-2 mt-4 ml-1">Access level</p>
            <div className="flex gap-3">
              {['viewer', 'editor'].map((role) => {
                const isSelected = shareRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setShareRole(role)}
                    className={`flex-1 h-10 rounded-full font-semibold text-sm capitalize text-white
                      ${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || ''}
                      transition-all duration-300 transform
                      ${isSelected ? 'background-pressed' : 'background-shadow-new background-hover'}`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white/10 border border-white/15 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Link2 size={20} className="text-white/80 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Public study link</p>
                <p className="text-sm text-white/60 mt-1">
                  {publicLink
                    ? 'Your public link is active. Copy it to share or revoke it anytime.'
                    : 'Create a link anyone can use to study this subject without an invite.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {publicLink ? (
                <>
                  <BackgroundButton
                    text="Copy link"
                    image={<Link2 size={18} />}
                    flip
                    bgColor="bg-indigo-500 hover:bg-indigo-400"
                    wWidth="w-full sm:w-auto"
                    onClick={handleCopyPublicLink}
                  />
                  <BackgroundButton
                    text="Revoke link"
                    bgColor="bg-gray-600 hover:bg-gray-500"
                    wWidth="w-full sm:w-auto"
                    onClick={handleRevokePublicLink}
                  />
                </>
              ) : (
                <BackgroundButton
                  text="Make public link"
                  image={<Link2 size={18} />}
                  flip
                  bgColor="bg-indigo-500 hover:bg-indigo-400"
                  wWidth="w-full sm:w-auto"
                  onClick={handleMakePublicLink}
                />
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white/10 border border-white/15 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Compass size={20} className="text-white/80 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Discover</p>
                <p className="text-sm text-white/60 mt-1">
                  {isPublished
                    ? 'This subject is listed in Discover for anyone to browse and practice.'
                    : profile?.username
                      ? 'List this subject in Discover so others can find and practice it for free.'
                      : 'Set a username in Profile settings first — it’s shown with your Discover listings.'}
                </p>
              </div>
            </div>
            <label htmlFor="discover-description" className="block text-sm font-bold text-white/90 mb-2 ml-1">
              Short description (optional)
            </label>
            <textarea
              id="discover-description"
              value={discoverDescription}
              onChange={(e) => setDiscoverDescription(e.target.value.slice(0, 280))}
              rows={2}
              placeholder="What will people learn?"
              className={`w-full px-4 py-3 rounded-2xl text-white resize-none
                ${secondaryColor?.bgClass || 'bg-purple-500'}
                background-shadow-new background-focus focus:outline-none font-medium
                placeholder:text-white/60`}
            />
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <span className="rounded-full bg-emerald-500/30 px-2.5 py-0.5 font-semibold text-emerald-100">
                Free
              </span>
              <span className="opacity-60">Paid listings coming soon</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              {isPublished ? (
                <>
                  <BackgroundButton
                    text="Update listing"
                    image={<Compass size={18} />}
                    flip
                    bgColor="bg-teal-500 hover:bg-teal-400"
                    wWidth="w-full sm:w-auto"
                    disabled={discoverBusy}
                    onClick={handlePublishDiscover}
                  />
                  <BackgroundButton
                    text="Unpublish"
                    bgColor="bg-gray-600 hover:bg-gray-500"
                    wWidth="w-full sm:w-auto"
                    disabled={discoverBusy}
                    onClick={handleUnpublishDiscover}
                  />
                </>
              ) : (
                <BackgroundButton
                  text="Publish to Discover"
                  image={<Compass size={18} />}
                  flip
                  bgColor={
                    profile?.username
                      ? 'bg-teal-500 hover:bg-teal-400'
                      : 'bg-gray-400'
                  }
                  wWidth="w-full sm:w-auto"
                  disabled={discoverBusy || !profile?.username}
                  onClick={handlePublishDiscover}
                />
              )}
            </div>
          </section>

          {subjectShares.length > 0 ? (
            <section>
              <p className="text-sm font-bold text-white/90 mb-2 ml-1">People with access</p>
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
                      <div className="relative share-permission-dropdown">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveShareDropdown(activeShareDropdown === share.id ? null : share.id)
                          }
                          className="capitalize flex items-center font-semibold text-white px-3 py-1.5 rounded-full bg-blue-500 background-shadow-new background-hover"
                        >
                          {share.permission}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 ml-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </button>
                        {activeShareDropdown === share.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleSharePermissionChange(share, 'viewer')}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Viewer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSharePermissionChange(share, 'editor')}
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
                        onClick={() => setShareToRemove(share)}
                        wSizing="w-9"
                        hSizing="h-9"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="py-6 text-center rounded-2xl bg-white/5 border border-white/10">
              <Share2 size={32} className="mx-auto mb-2 text-white/40" />
              <p className="text-sm font-semibold text-white/80">No collaborators yet</p>
              <p className="mt-1 text-sm text-white/50">Invite someone above to give them access.</p>
            </div>
          )}
        </div>
      </GlassPanel>

      <ConfirmModal
        isOpen={Boolean(shareToRemove)}
        onClose={() => setShareToRemove(null)}
        onConfirm={handleConfirmRemoveShare}
        title="Remove access"
        message={`Remove access for ${shareToRemove?.recipient_email}?`}
        icon={<Share2 size={20} />}
        confirmText="Remove"
      />
    </>
  );
}

export default ShareSubjectModal;
