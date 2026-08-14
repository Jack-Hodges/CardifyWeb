import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import BackgroundButton from '../Elements/BackgroundButton';
import CardAssist from './CardAssist';
import featureFlags from '../../config/featureFlags';
import { useUser } from '../../UserContext';
import { Image, Calculator, Text, Brush, X, Layers } from 'lucide-react';
import Drawing from '../Drawing/Drawing';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import MathKeypad from './MathKeypad';
import ConfirmModal from '../Modals/ConfirmModal';

addStyles();

function EditModal({
  isOpen,
  onClose,
  card,
  subject,
  handleUpsertCard,
  text,
  clear
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const { user } = useUser();

  const [frontContent, setFrontContent] = useState('');
  const [frontMode, setFrontMode] = useState(0);
  const [backContent, setBackContent] = useState('');
  const [backMode, setBackMode] = useState(0);

  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);
  const snapshotRef = useRef(null);
  const [frontMathField, setFrontMathField] = useState(null);
  const [backMathField, setBackMathField] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [drawingSaved, setDrawingSaved] = useState(false);
  const [isDrawingPopupOpen, setIsDrawingPopupOpen] = useState(false);

  useBodyScrollLock(isVisible || isClosing);

  // Visibility only tracks isOpen — do not depend on card, or a save
  // that updates the card restarts the open animation mid-close.
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      setIsClosing(false);
      setShowUnsavedConfirm(false);
      return;
    }
    setIsVisible(true);
    setIsClosing(false);
    setShowUnsavedConfirm(false);
  }, [isOpen]);

  // Hydrate form once when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    let front = '';
    let back = '';
    let nextFrontMode = 0;
    let nextBackMode = 0;

    if (!clear && card) {
      front = card.question ?? '';
      back = card.answer ?? '';
      nextFrontMode = card.frontMode ?? 0;
      nextBackMode = card.backMode ?? 0;
    }

    setFrontContent(front);
    setBackContent(back);
    setFrontMode(nextFrontMode);
    setBackMode(nextBackMode);
    setSelectedFile(null);
    setImageUploaded(false);
    setDrawingSaved(false);
    snapshotRef.current = {
      front,
      back,
      frontMode: nextFrontMode,
      backMode: nextBackMode,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDrawingPopupOpen && !showUnsavedConfirm) {
        requestClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isDrawingPopupOpen, showUnsavedConfirm]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = () => {
    const snap = snapshotRef.current;
    if (!snap) return false;
    return (
      frontContent !== snap.front ||
      backContent !== snap.back ||
      frontMode !== snap.frontMode ||
      backMode !== snap.backMode ||
      selectedFile != null
    );
  };

  const handleClose = () => {
    if (isClosing) return;
    setShowUnsavedConfirm(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const requestClose = () => {
    if (isClosing) return;
    if (isDirty()) {
      setShowUnsavedConfirm(true);
      return;
    }
    handleClose();
  };

  const handleSave = async () => {
    const cardToSave = {
      id: card?.id,
      user_id: card?.user_id || user?.id,
      subject_id: card?.subject_id || subject?.id,
      question: frontContent,
      answer: backContent,
      frontMode,
      backMode,
      image_url: card?.image_url
    };

    try {
      await handleUpsertCard(cardToSave, selectedFile);
    } catch (error) {
      console.error('Error in handleSave:', error);
      return;
    }

    // Treat as clean so close never trips the unsaved prompt
    snapshotRef.current = {
      front: frontContent,
      back: backContent,
      frontMode,
      backMode,
    };
    setSelectedFile(null);
    handleClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImageUploaded(true);
    } else setSelectedFile(null);
  };

  const backImageInputRef = useRef(null);
  const handleBackImageUploadClick = () => {
    if (backImageInputRef.current) {
      backImageInputRef.current.click();
    }
  };

  const applyFormatting = (field, openSyntax, closeSyntax = openSyntax) => {
    const isInvalid =
      (field === 'front' && frontMode !== 0) ||
      (field === 'back' && backMode !== 0);
    if (isInvalid) return;

    const textarea =
      field === 'front' ? frontTextAreaRef.current : backTextAreaRef.current;
    const content = field === 'front' ? frontContent : backContent;
    const setContent = field === 'front' ? setFrontContent : setBackContent;
    const { selectionStart, selectionEnd } = textarea;

    const before = content.substring(0, selectionStart);
    const selected = content.substring(selectionStart, selectionEnd);
    const after = content.substring(selectionEnd);

    if (selectionStart === selectionEnd) {
      const newText = before + openSyntax + closeSyntax + after;
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = selectionStart + openSyntax.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    } else {
      const newText = before + openSyntax + selected + closeSyntax + after;
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        const cursorPosition =
          selectionEnd + openSyntax.length + closeSyntax.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    }
  };

  const handleBoldClick = (field) => applyFormatting(field, '**');
  const handleItalicClick = (field) => applyFormatting(field, '*');
  const handleUnderlineClick = (field) => applyFormatting(field, '<u>', '</u>');

  const handleKeyDown = (e, setContent, content, isMathMode) => {
    if (isMathMode) return;
    const { selectionStart: start, selectionEnd: end } = e.target;
    const value = content;

    if (e.key === ' ' && value.substring(start - 1, start) === '-') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);

      if (currentLine === '-') {
        e.preventDefault();
        setContent(value.substring(0, start - 1) + '• ' + value.substring(end));
        setTimeout(() => e.target.setSelectionRange(start + 1, start + 1), 0);
        return;
      }
    }
    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      if (currentLine.startsWith('• ')) {
        e.preventDefault();
        setContent(value.substring(0, start) + '\n• ' + value.substring(end));
        setTimeout(() => e.target.setSelectionRange(start + 3, start + 3), 0);
      }
    }
  };

  const openDrawingPopup = () => {
    setIsDrawingPopupOpen(true);
  };

  const handleDrawingSave = (file) => {
    setSelectedFile(file);
    setDrawingSaved(true);
  };

  const closeDrawingPopup = () => {
    setIsDrawingPopupOpen(false);
  };

  if (!isVisible && !isClosing) return null;

  const isEditing = Boolean(card?.id);
  const title = isEditing ? 'Edit flashcard' : 'Add flashcard';
  const subtitle = subject?.name ? `In ${subject.name}` : (text || 'Question and answer');

  return ReactDOM.createPortal(
    <>
    <div
      data-tour-edit-modal
      className={`fixed inset-0 flex items-center justify-center z-[70] p-0 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={requestClose}
      />

      <div
        className={`relative w-full sm:max-w-2xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden flex flex-col
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
                <Layers size={22} className="text-white/90 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{title}</h2>
              </div>
              <p className="text-sm text-white/60">{subtitle}</p>
            </div>
            <BackgroundButton
              image={<X size={20} strokeWidth={3} />}
              bgColor="bg-red-500 hover:bg-red-400"
              onClick={requestClose}
              dataTour="create-edit-close"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 space-y-6">
          {/* Front (Question) */}
          <section>
            <label htmlFor="question" className="block text-sm font-bold text-white/90 mb-2 ml-1">
              Question
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={frontMode} modeText="front" />
              <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={frontMode} modeText="front" />
              <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={frontMode} modeText="front" />
              <EditButton mode={frontMode} setMode={setFrontMode} svg={<Text size={16} />} text="Text" val={0} activeColor="bg-blue-500" />
              <EditButton mode={frontMode} setMode={setFrontMode} svg={<Calculator size={16} />} text="Math" val={1} activeColor="bg-purple-500" />
            </div>
            {frontMode === 1 && (
              <div>
                <div className="bg-white dark:bg-gray-700 w-full p-3 rounded-2xl text-gray-800 dark:text-white background-shadow-new background-focus min-h-[6rem]">
                  <EditableMathField
                    latex={frontContent}
                    mathquillDidMount={setFrontMathField}
                    onChange={(mathField) => {
                      setFrontContent(mathField.latex());
                    }}
                    style={{
                      minHeight: '4rem',
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      border: 'none'
                    }}
                  />
                </div>
                <MathKeypad
                  mathField={frontMathField}
                  onChange={setFrontContent}
                />
              </div>
            )}
            {frontMode === 0 && (
              <textarea
                ref={frontTextAreaRef}
                id="question"
                value={frontContent}
                onChange={(e) => setFrontContent(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, setFrontContent, frontContent, frontMode === 'math')}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                  background-shadow-new background-focus focus:outline-none font-medium
                  placeholder:text-gray-400 resize-none h-28"
                placeholder="Enter the question here"
              />
            )}
            {frontMode === 2 && (
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white background-shadow-new"
                />
                <p className="text-sm text-white/60 mt-2 ml-1">Upload an image for the question</p>
              </div>
            )}
          </section>

          {/* Back (Answer) */}
          <section>
            <label htmlFor="answer" className="block text-sm font-bold text-white/90 mb-2 ml-1">
              Answer
            </label>
            <div className="mb-3 flex flex-wrap gap-2" data-tour="create-edit-modes">
              <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={backMode} modeText="back" />
              <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={backMode} modeText="back" />
              <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={backMode} modeText="back" />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Text size={16} />} text="Text" val={0} activeColor="bg-blue-500" />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Calculator size={16} />} text="Math" val={1} activeColor="bg-purple-500" />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Image size={16} />} text="Image" val={2} activeColor="bg-green-500" />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Brush size={16} />} text="Draw" val={3} activeColor="bg-orange-500" />
            </div>
            {backMode === 1 && (
              <div>
                <div className="bg-white dark:bg-gray-700 w-full p-3 rounded-2xl text-gray-800 dark:text-white background-shadow-new background-focus min-h-[6rem]">
                  <EditableMathField
                    latex={backContent}
                    mathquillDidMount={setBackMathField}
                    onChange={(mathField) => {
                      setBackContent(mathField.latex());
                    }}
                    style={{
                      minHeight: '4rem',
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      border: 'none'
                    }}
                  />
                </div>
                <MathKeypad
                  mathField={backMathField}
                  onChange={setBackContent}
                />
              </div>
            )}
            {backMode === 0 && (
              <textarea
                ref={backTextAreaRef}
                id="answer"
                value={backContent}
                onChange={(e) => setBackContent(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, setBackContent, backContent, backMode === 'math')}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                  background-shadow-new background-focus focus:outline-none font-medium
                  placeholder:text-gray-400 resize-none h-28"
                placeholder="Enter the answer here"
              />
            )}
            {backMode === 2 && (
              <button
                type="button"
                className="w-full h-28 rounded-2xl flex justify-center items-center cursor-pointer
                  bg-white dark:bg-gray-700 background-shadow-new background-hover"
                onClick={handleBackImageUploadClick}
              >
                <input type="file" accept="image/*" onChange={handleFileChange} ref={backImageInputRef} className="hidden" />
                <div className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-white">
                  <Image size={22} />
                  <span>{imageUploaded ? 'Image uploaded' : 'Upload an image'}</span>
                </div>
              </button>
            )}
            {backMode === 3 && (
              <button
                type="button"
                className="w-full h-28 rounded-2xl flex justify-center items-center cursor-pointer
                  bg-white dark:bg-gray-700 background-shadow-new background-hover"
                onClick={openDrawingPopup}
              >
                <div className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-white">
                  <Brush size={22} />
                  <span>{drawingSaved ? 'Drawing added' : 'Add a drawing'}</span>
                </div>
              </button>
            )}
          </section>

          {featureFlags.aiCardAssist && (
            <CardAssist
              question={frontContent}
              answer={backContent}
              onApply={(text) => setBackContent(text)}
            />
          )}
        </div>

        <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
          <div className="flex sm:justify-end">
            <BackgroundButton
              text="Save card"
              bgColor="bg-blue-500 hover:bg-blue-400"
              wWidth="w-full sm:w-auto"
              onClick={handleSave}
            />
          </div>
        </div>
      </div>
    </div>

      {isDrawingPopupOpen && (
        <DrawingPopup onSaveDrawing={handleDrawingSave} onClose={closeDrawingPopup} />
      )}

      <ConfirmModal
        isOpen={showUnsavedConfirm}
        onClose={() => setShowUnsavedConfirm(false)}
        onConfirm={handleClose}
        title="Unsaved changes"
        message="You have unsaved changes. Discard them?"
        confirmText="Discard"
        confirmColor="bg-red-500 hover:bg-red-400"
      />
    </>,
    document.body
  );
}

export default EditModal;

function EditButton({ mode, setMode, svg, text, val, onClick, activeColor = 'bg-blue-500' }) {
  const handleClick = () => {
    if (onClick) onClick();
    setMode(val);
  };

  const active = mode === val;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-bold
        background-shadow-new background-hover transition-colors
        ${active
          ? `${activeColor} text-white`
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
        }`}
    >
      {svg}
      <span>{text}</span>
    </button>
  );
}

function TextButton({ text, handleClick, mode, modeText }) {
  return (
    <button
      type="button"
      onClick={() => handleClick(modeText)}
      disabled={mode !== 0}
      className={`w-9 h-9 rounded-full font-bold flex items-center justify-center shrink-0
        background-shadow-new background-hover
        bg-white dark:bg-gray-700 text-gray-800 dark:text-white
        ${mode !== 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {text}
    </button>
  );
}

function DrawingPopup({ onSaveDrawing, onClose }) {
  const canvasRef = useRef();
  const { theme } = useUser();
  const { secondaryColor } = theme || {};

  useBodyScrollLock(true);

  const handleSaveDrawing = () => {
    try {
      const file = canvasRef.current.exportDrawing();
      onSaveDrawing(file);
      onClose();
    } catch (err) {
      console.error('Failed to export drawing', err);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[90] select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full h-full max-h-[100dvh] sm:w-[min(96vw,72rem)] sm:h-[min(92dvh,56rem)] sm:max-h-[90dvh] sm:rounded-2xl overflow-hidden flex flex-col
          bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
          border border-white/20 shadow-2xl shadow-black/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Brush size={22} className="text-white/90 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">Drawing</h2>
              </div>
              <p className="text-sm text-white/60">Sketch on the canvas, then save to your card</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <BackgroundButton
                text="Save drawing"
                bgColor={
                  theme
                    ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                    : 'bg-blue-500 hover:bg-blue-400'
                }
                onClick={handleSaveDrawing}
              />
              <BackgroundButton
                image={<X size={18} strokeWidth={3} />}
                bgColor="bg-red-500 hover:bg-red-400"
                onClick={onClose}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-white relative overflow-hidden">
          <Drawing ref={canvasRef} />
        </div>
      </div>
    </div>,
    document.body
  );
}
