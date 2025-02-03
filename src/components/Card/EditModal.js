import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';

addStyles();

function EditModal({
  isOpen,
  onClose,
  card,
  subject,
  handleUpsertCard,
  text,
  clear,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { user } = useUser();

  // Front mode can be "text", "math", or "image"
  const [frontContent, setFrontContent] = useState('');
  const [frontMode, setFrontMode] = useState(0);
  // Back mode can be "text", "math", or "image"
  const [backContent, setBackContent] = useState('');
  const [backMode, setBackMode] = useState(0);

  // Refs for textareas
  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);

  // File for the back side (or front if you want to expand that logic)
  const [selectedFile, setSelectedFile] = useState(null);

  const svgs = {
    text: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    math: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
    image: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
    drawing: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    )
  }

  useEffect(() => {

    if (clear) {
      setFrontContent('');
      setFrontMode(0);
      setBackContent('');
      setBackMode(0);
      setSelectedFile(null);
    }

    if (card) {
      setFrontMode(card.frontMode);
      setFrontContent(card.question);
      setBackMode(card.backMode);
      setBackContent(card.answer);
    }
    if (isOpen) {
      setIsVisible(true);
    } else if (!isClosing) {
      setIsVisible(false);
    }
  }, [isOpen, isClosing, card, clear]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setIsVisible(false);
    }, 300);
  };

  // Called when user presses "Save"
  const handleSave = async () => {
    // Build the object for upsert
    const cardToSave = {
      id: card?.id,  // if undefined => insert, if defined => update
      user_id: card?.user_id || user?.id,
      subject_id: card?.subject_id || subject?.id,
      question: frontContent,
      answer: backContent,
      frontMode,
      backMode,
      image_url: card?.image_url,
    };

    try {
      await handleUpsertCard(cardToSave, selectedFile);
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
    handleClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) setSelectedFile(e.target.files[0]);
    else setSelectedFile(null);
  };

  // Helper for bold/italic/underline in "text" mode only
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

    // If no text selected, just insert e.g. "**" + "**"
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
      // Wrap selection
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

  // Handle bullet logic in text mode
  const handleKeyDown = (e, setContent, content, isMathMode) => {
    if (isMathMode) return;
    const { selectionStart: start, selectionEnd: end } = e.target;
    const value = content;

    // Replace "- " with "• " on space
    if (e.key === ' ' && value.substring(start - 1, start) === '-') {
      e.preventDefault();
      setContent(value.substring(0, start - 1) + '• ' + value.substring(end));
      setTimeout(() => e.target.setSelectionRange(start + 1, start + 1), 0);
      return;
    }

    // Create new bullet on Enter if current line starts with "• "
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

  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
          isClosing ? 'animate-pop-down' : 'animate-pop-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-0 text-green-500">{text}</h2>

        {/* ========== Front (Question) ========== */}
        <div className="mb-6">
          <label
            htmlFor="question"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Question
          </label>

          {/* Formatting Buttons (only active in "text" mode) */}
          <div className="mb-2 flex space-x-2">
            <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={frontMode} modeText="front" />
            <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={frontMode} modeText="front" />
            <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={frontMode} modeText="front" />
            
            <EditButton mode={frontMode} setMode={setFrontMode} svg={svgs.text} text="Text" val={0} extend/>
            <EditButton mode={frontMode} setMode={setFrontMode} svg={svgs.math} text="Math" val={1} extend/>
          </div>

          {/* Conditionally render based on frontMode */}
          {frontMode === 1 && (
            <div className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md min-h-[6rem] text-gray-500 dark:text-gray-200">
              <EditableMathField
                latex={frontContent}
                onChange={(mathField) => setFrontContent(mathField.latex())}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  border: 'none',
                }}
              />
            </div>
          )}

          {frontMode === 0 && (
            <textarea
              ref={frontTextAreaRef}
              id="question"
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(e, setFrontContent, frontContent, frontMode === 'math')
              }
              className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
              placeholder="Enter the question here"
            />
          )}

          {frontMode === 2 && (
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-gray-600 dark:text-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2">
                (Upload an image for the question)
              </p>
            </div>
          )}
        </div>

        {/* ========== Back (Answer) ========== */}
        <div className="mb-6">
          <label
            htmlFor="answer"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Answer
          </label>

          <div className="mb-2 flex space-x-2">
            <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={backMode} modeText="back" />
            <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={backMode} modeText="back" />
            <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={backMode} modeText="back" />
            
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.text} text="Text" val={0} extend/>
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.math} text="Math" val={1} extend/>
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.image} text="Image" val={2} />
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.drawing} text="Draw" val={3} />
          </div>

          {backMode === 1 && (
            <div className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md min-h-[6rem] text-gray-500 dark:text-gray-200">
              <EditableMathField
                latex={backContent}
                onChange={(mathField) => setBackContent(mathField.latex())}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  border: 'none',
                }}
              />
            </div>
          )}

          {backMode === 0 && (
            <textarea
              ref={backTextAreaRef}
              id="answer"
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(e, setBackContent, backContent, backMode === 'math')
              }
              className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
              placeholder="Enter the answer here"
            />
          )}

          {backMode === 2 && (
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-gray-600 dark:text-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2">
                (Upload an image for the answer)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <BackgroundButton
            text="Cancel"
            bgColor="bg-red-500 hover:bg-red-400"
            onClick={handleClose}
          />
          <BackgroundButton
            text="Save"
            bgColor="bg-blue-500 hover:bg-blue-400"
            onClick={handleSave}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditModal;

function EditButton({mode, setMode, svg, text, val, extend}) {
  return (
    <button
      onClick={() => setMode(val)}
      className={`bg-gray-100 ${extend ? 'w-[4rem]' : 'w-20'} h-8 rounded-md hover:bg-gray-200 ${
        mode === val ? 'bg-gray-300' : ''
      }`}
    >
      <div className="flex items-center justify-around space-x-2 px-1">
        {svg}
        {text}
      </div>
    </button>
  );
}

function TextButton({text, handleClick, mode, modeText}) {
  return (
    <button
      onClick={() => handleClick(modeText)}
      disabled={mode !== 0}
      className={`bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200 ${
        mode !== 0 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {text}
    </button>
  );
}