import getColors from "../Functions/getColors";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCardArt } from "../Functions/getCardArt";
import { useUser } from "../../UserContext";
import { Share } from "lucide-react";
import Modal from "../Modal/Modal";
import { saveShare, removeShare } from "./SubjectManipulation";

function SubjectBlock({ subject, onEdit, onSave, onRemoveSubject, home, shared = false, editPermission = true }) {
  const [hoveredIcon, setHoveredIcon] = useState(null); // Tracks hovered icon
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer"); // Add role state
  const navigate = useNavigate();
  const { profile, user } = useUser();
  // Use local state for the pinned status
  const [subjectPinned, setSubjectPinned] = useState(subject?.pinned || false);

  // Set local state when subject prop changes
  useEffect(() => {
    if (subject) {
      setSubjectPinned(subject.pinned);
    }
  }, [subject]);

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
    navigate("/practice", { state: { subject } }); // Navigate to practice with subject and user
  };

  const handleCreateClick = () => {
    navigate("/create", { state: { subject } }); // Navigate to CreateCards with subject and user
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail) return; // Don't proceed if no email provided
    
    const success = await saveShare(null, subject.id, shareEmail, shareRole);
    if (success) {
      setIsShareModalOpen(false);
      setShareEmail("");
      setShareRole("viewer"); // Reset role after sharing
    }
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

  // Memoize the background style to prevent recalculation
  const backgroundStyle = useMemo(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: cardArt.image,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.85,
    borderRadius: 'inherit'
  }), [cardArt.image]);

  return (
    <>
      <div
        className={`group relative mx-auto w-full min-h-56 sm:h-56 ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow-new background-hover cursor-pointer transition duration-300`}
        style={{ 
          position: 'relative'
        }}
      >
        <div style={backgroundStyle} />
        {!shared && (
          <div className="absolute top-0 right-0 flex gap-2 p-2 opacity-1 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300 items-center">
            <div onClick={handleShareClick}>
              <Share className="w-7 h-7 text-white mt-[-8px]" />
            </div>
            <div onClick={handleTogglePin}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                viewBox="-5 -10 110 135"
                className="w-12 h-12"
              >
                <path
                  d="m59.926 58.926 18.52-20.766c2.9961 0.625 5.8672 0.375 8.0312-0.95703 0.78906-0.5 0.91406-1.6211 0.20703-2.3711l-21.516-21.516c-0.75-0.75-1.8711-0.625-2.3711 0.20703-1.332 2.1641-1.582 5.0352-0.95703 8.0312l-20.766 18.52c-5.5352-2.082-11.027-2.1211-14.941 0.29297-1.125 0.70703-1.2891 2.2891-0.29297 3.3281l13.73 13.73-15.523 15.523c-0.83203 0.83203-0.83203 2.1211 0 2.9531 0.83203 0.83203 2.1211 0.83203 2.9531 0l15.523-15.523 13.73 13.73c1.0391 1.0391 2.6211 0.875 3.3281-0.29297 2.4141-3.9531 2.3711-9.4062 0.29297-14.941z"
                  fill={subjectPinned ? "white" : "none"}
                  stroke="white"
                  strokeWidth="5"
                />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 mb-1 w-full">
          <h1 className={`ml-3 mr-2 text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words line-clamp-2 hyphens-auto ${cardArt.image ? 'drop-shadow-custom' : ''}`}>
            {subject.name}
          </h1>
          <p className={`ml-3 text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words overflow-hidden text-ellipsis ${cardArt.image ? 'drop-shadow-custom' : ''}`}>
            {subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}
          </p>

          <div
            className={`${
              home ? "flex ml-2" : "grid grid-cols-4"
            } gap-4 w-full opacity-1 sm:opacity-0 justify-items-center sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300`}
          >
            {/* Play button */}
            <SubjectButton
              img={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10"
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

            {(!shared || subject.permission === 'editor') && (
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
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
              />
            )}

            {!home && !shared && (
              // Edit button
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
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

            {!home && !shared && (
              // Delete button
              <SubjectButton
                img={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-10"
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

            {shared && (
              <SubjectButton
                img={<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>}
                setHoveredIcon={setHoveredIcon}
                hoveredIcon={hoveredIcon}
                tooltipText="Leave"
                onClick={() => setIsLeaveModalOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isShareModalOpen}
        onFirstAction={() => setIsShareModalOpen(false)}
        onSecondAction={handleShareSubmit}
        text="Share Subject"
        mainText={
          <div className="w-full space-y-4">
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            />
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="radio"
                  value="viewer"
                  checked={shareRole === "viewer"}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="form-radio text-blue-500"
                />
                <span>Viewer</span>
              </label>
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="radio"
                  value="editor"
                  checked={shareRole === "editor"}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="form-radio text-blue-500"
                />
                <span>Editor</span>
              </label>
            </div>
          </div>
        }
        firstActionText="Cancel"
        secondActionText="Share"
        firstActionCol="bg-red-500 hover:bg-red-400"
        secondActionCol="bg-blue-500 hover:bg-blue-400"
        titleCol="text-white"
      />

      <Modal
        isOpen={isLeaveModalOpen}
        onFirstAction={() => setIsLeaveModalOpen(false)}
        onSecondAction={handleLeaveSubject}
        text="Leave Subject"
        mainText="Are you sure you want to leave this subject? You will no longer have access to it."
        firstActionText="Cancel"
        secondActionText="Leave"
        firstActionCol="bg-gray-500 hover:bg-gray-400"
        secondActionCol="bg-red-500 hover:bg-red-400"
        titleCol="text-white"
      />
    </>
  );
}

function SubjectButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {
  const lowerCase = tooltipText.toLowerCase();
  return (
    <div
      className="relative text-white block items-center"
      onMouseEnter={() => setHoveredIcon(lowerCase)}
      onMouseLeave={() => setHoveredIcon(null)}
      onClick={onClick}
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