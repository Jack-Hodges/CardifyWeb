import getColors from "../Functions/getColors";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCardArt } from "../Functions/getCardArt";
import CardArtOverlay from "../Elements/CardArtOverlay";
import { useUser } from "../../UserContext";
import { Share, LogOut, Share2, Mail, Link2, X } from "lucide-react";
import GlassPanel from "../Modals/GlassPanel";
import BackgroundButton from "../Elements/BackgroundButton";
import ConfirmModal from "../Modals/ConfirmModal";
import {
  saveShare,
  removeShare,
  createShareInvite,
  createOrGetPublicLink,
  revokePublicLink,
  getShares,
  fetchPublicLink,
  TUTORIAL_SUBJECT_ID,
} from "./SubjectManipulation";
import { toast } from '../Toast';

function SubjectBlock({ subject, onEdit, onSave, onRemoveSubject, onDismissTutorial, home, shared = false, tourTarget = false, forceActions = false }) {
  const [hoveredIcon, setHoveredIcon] = useState(null); // Tracks hovered icon
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [publicLink, setPublicLink] = useState(null);
  const [subjectShares, setSubjectShares] = useState([]);
  const [activeShareDropdown, setActiveShareDropdown] = useState(null);
  const [shareToRemove, setShareToRemove] = useState(null);
  const navigate = useNavigate();
  const { profile, user, theme } = useUser();
  const { secondaryColor } = theme;
  // Use local state for the pinned status
  const [subjectPinned, setSubjectPinned] = useState(subject?.pinned || false);

  const isSharedSubject = shared || subject?.isShared || Boolean(subject?.permission);
  const isTutorialSubject = subject?.id === TUTORIAL_SUBJECT_ID;

  // Set local state when subject prop changes
  useEffect(() => {
    if (subject) {
      setSubjectPinned(subject.pinned);
    }
  }, [subject]);

  useEffect(() => {
    if (!isShareModalOpen || !profile?.id || !subject?.id) return;

    const loadShareData = async () => {
      const allShares = await getShares(profile.id);
      setSubjectShares(allShares.filter((share) => share.subject_id === subject.id));
      const link = await fetchPublicLink(subject.id, profile.id);
      setPublicLink(link);
    };

    loadShareData();
  }, [isShareModalOpen, profile?.id, subject?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeShareDropdown && !event.target.closest('.share-permission-dropdown')) {
        setActiveShareDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeShareDropdown]);

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setShareEmail("");
    setShareRole("viewer");
    setActiveShareDropdown(null);
    setPublicLink(null);
  };

  const refreshSubjectShares = async () => {
    if (!profile?.id || !subject?.id) return;
    const allShares = await getShares(profile.id);
    setSubjectShares(allShares.filter((share) => share.subject_id === subject.id));
  };

  // Toggle the pinned state and save it
  const handleTogglePin = () => {
    // Calculate the new pinned value
    const newPinned = !subjectPinned;
    // Update the state
    setSubjectPinned(newPinned);
    // Call the save function with the new value
    onSave(
      subject?.id,
      subject?.name,
      subject?.colourText,
      subject?.colourIntensity,
      subject?.up_to_index,
      subject?.collection_id,
      newPinned
    );
  };

  const handlePracticeClick = () => {
    navigate(`/practice/${subject.id}`, { state: { subject } });
  };

  const handleCreateClick = () => {
    navigate(`/create/${subject.id}`, { state: { subject } });
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail) return;

    const invite = await createShareInvite(profile.id, subject.id, shareEmail, shareRole);
    const success = await saveShare(null, profile.id, subject.id, shareEmail, shareRole);
    if (invite || success) {
      setShareEmail("");
      setShareRole("viewer");
      await refreshSubjectShares();
      toast.success('Invite sent');
    }
  };

  const handleSharePermissionChange = async (share, newPermission) => {
    const success = await saveShare(share.id, share.owner_id, share.subject_id, share.recipient_email, newPermission);
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

  const handleLeaveSubject = async () => {
    console.log(user.email);
    const success = await removeShare(subject.id, user.email);
    if (success) {
      // Instead of calling onRemoveSubject, we'll navigate to dashboard
      navigate('/dashboard');
    }
    setIsLeaveModalOpen(false);
  };

  // Memoize color calculation based on subject's color info
  const colors = useMemo(
    () => getColors([subject.colourText, subject.colourIntensity]),
    [subject.colourText, subject.colourIntensity]
  );

  // Memoize the card art value
  const cardArt = useMemo(() => {
    const art = profile?.card_art ? getCardArt(profile.card_art) : { image: null };
    return art;
  }, [profile?.card_art]);

  const cardArtImage = cardArt.image;

  return (
    <>
      <div
        className={`group relative mx-auto w-full min-h-44 sm:h-56 overflow-hidden ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow-new background-hover cursor-pointer transition duration-300`}
        style={{ 
          position: 'relative',
          zIndex: forceActions ? 55 : undefined,
        }}
        data-tour={tourTarget ? 'dashboard-subject' : undefined}
      >
        <CardArtOverlay image={cardArtImage} />
        {isSharedSubject && (
          <span
            className={`absolute top-2 left-3 z-10 text-xs font-bold uppercase tracking-wide text-white ${cardArt.image ? 'drop-shadow-custom' : ''}`}
          >
            Shared · {subject.permission || 'viewer'}
          </span>
        )}
        {isTutorialSubject && (
          <span
            className={`absolute top-2 left-3 z-10 text-xs font-bold uppercase tracking-wide text-white ${cardArt.image ? 'drop-shadow-custom' : ''}`}
          >
            Sample
          </span>
        )}
        {!isSharedSubject && !isTutorialSubject && (
          <div className="absolute top-0 right-0 flex gap-2 p-2 opacity-1 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300 items-center">
            <div 
              className="relative"
              onMouseEnter={() => setHoveredIcon('share')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={handleShareClick}
            >
              <Share className="w-7 h-7 text-white mt-[-8px]" style={{ filter: cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none" }} />
              {hoveredIcon === 'share' && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  Share
                </div>
              )}
            </div>
            <div 
              className="relative"
              onMouseEnter={() => setHoveredIcon('pin')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={handleTogglePin}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                viewBox="-5 -10 110 135"
                className="w-12 h-12"
                filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
              >
                <path
                  d="m59.926 58.926 18.52-20.766c2.9961 0.625 5.8672 0.375 8.0312-0.95703 0.78906-0.5 0.91406-1.6211 0.20703-2.3711l-21.516-21.516c-0.75-0.75-1.8711-0.625-2.3711 0.20703-1.332 2.1641-1.582 5.0352-0.95703 8.0312l-20.766 18.52c-5.5352-2.082-11.027-2.1211-14.941 0.29297-1.125 0.70703-1.2891 2.2891-0.29297 3.3281l13.73 13.73-15.523 15.523c-0.83203 0.83203-0.83203 2.1211 0 2.9531 0.83203 0.83203 2.1211 0.83203 2.9531 0l15.523-15.523 13.73 13.73c1.0391 1.0391 2.6211 0.875 3.3281-0.29297 2.4141-3.9531 2.3711-9.4062 0.29297-14.941z"
                  fill={subjectPinned ? "white" : "none"}
                  stroke="white"
                  strokeWidth="5"
                />
              </svg>
              {hoveredIcon === 'pin' && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  {subjectPinned ? 'Unpin' : 'Pin'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 mb-1 w-full">
          <h1 className={`ml-3 mr-2 text-2xl sm:text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 break-words line-clamp-2 hyphens-auto ${cardArt.image ? 'drop-shadow-custom' : ''} ${
            forceActions ? 'sm:translate-y-0' : 'sm:translate-y-8 sm:group-hover:-translate-y-3'
          }`}>
            {subject.name}
          </h1>
          <p className={`ml-3 text-base sm:text-lg text-white font-bold transform transition-transform duration-300 break-words overflow-hidden text-ellipsis ${cardArt.image ? 'drop-shadow-custom' : ''} ${
            forceActions ? 'sm:translate-y-0' : 'sm:translate-y-8 sm:group-hover:-translate-y-3'
          }`}>
            {subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}
          </p>

          <div
            className={`${
              home ? "flex ml-2" : "grid grid-cols-4"
            } gap-4 w-full opacity-1 justify-items-center transition duration-300 ${
              forceActions
                ? 'sm:opacity-100 sm:translate-y-0'
                : 'sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100'
            }`}
          >
            {/* Play button */}
            <SubjectButton
              img={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10"
                  filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              setHoveredIcon={setHoveredIcon}
              hoveredIcon={hoveredIcon}
              tooltipText="Practice"
              onClick={handlePracticeClick}
            />

            {(!isSharedSubject || subject.permission === 'editor') && (
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
                    filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Add"
                onClick={handleCreateClick}
                dataTour={tourTarget ? 'dashboard-subject-add' : undefined}
              />
            )}

            {!home && !isSharedSubject && !isTutorialSubject && (
              // Edit button
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
                    filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
                  >
                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                    <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                  </svg>
                }
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Edit"
                onClick={onEdit}
              />
            )}

            {!home && isTutorialSubject && (
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
                    filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3.75 8.25a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Remove"
                onClick={onDismissTutorial}
              />
            )}

            {!home && !isSharedSubject && !isTutorialSubject && (
              // Delete button
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
                    filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Delete"
                onClick={onRemoveSubject}
              />
            )}

            {isSharedSubject && (
              <SubjectButton
                img={<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out-icon lucide-log-out" filter={cardArt.image ? "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))" : "none"}><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>}
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Leave"
                onClick={() => setIsLeaveModalOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      <GlassPanel
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        title="Share subject"
        subtitle={subject?.name}
        icon={<Share2 size={22} className="text-white/90 shrink-0" />}
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <BackgroundButton
              text="Cancel"
              bgColor="bg-gray-600 hover:bg-gray-500"
              wWidth="w-full sm:w-auto"
              onClick={closeShareModal}
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
                ${secondaryColor.bgClass}
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
                      ${secondaryColor.bgClass} ${secondaryColor.hoverClass}
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
                          onClick={() => setActiveShareDropdown(activeShareDropdown === share.id ? null : share.id)}
                          className="capitalize flex items-center font-semibold text-white px-3 py-1.5 rounded-full bg-blue-500 background-shadow-new background-hover"
                        >
                          {share.permission}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          handleLeaveSubject();
        }}
        title="Leave subject"
        message="Are you sure you want to leave this subject? You will no longer have access to it."
        icon={<LogOut size={20} />}
        confirmText="Leave"
      />
    </>
  );
}

function SubjectButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick, dataTour }) {
  const lowerCase = tooltipText.toLowerCase();
  return (
    <div
      className="relative text-white block items-center"
      onMouseEnter={() => setHoveredIcon(lowerCase)}
      onMouseLeave={() => setHoveredIcon(null)}
      onClick={onClick}
      data-tour={dataTour}
    >
      {img}
      {hoveredIcon === lowerCase && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

export default SubjectBlock;