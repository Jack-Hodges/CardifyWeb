import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
// MathQuill
import { EditableMathField, addStyles } from 'react-mathquill';

import BackgroundButton from '../Elements/BackgroundButton';

// Make sure MathQuill CSS is loaded
addStyles();

function EditModal({
  isOpen,
  onClose,
  onSave,
  frontContent,
  backContent,
  setFrontContent,
  setBackContent,
  text,
  alignment,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Whether to show text or math for Question
  // (unchanged for front)
  const [frontIsMathMode, setFrontIsMathMode] = useState(false);

  /**
   * Replace the old "backIsMathMode" boolean with a "backMode" string.
   * It can be: "text", "math", or "image".
   */
  const [backMode, setBackMode] = useState('text');

  // Refs for textareas
  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);

  // State for selected file (only for answer side)
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (!isClosing) {
      setIsVisible(false);
    }
  }, [isOpen, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setIsVisible(false);
    }, 300);
  };

  // Called when user clicks "Save"
  const handleSave = () => {
    // Pass the selected file (or null) to the parent
    onSave(frontContent, backContent, selectedFile);
    handleClose();
  };

  // Handle user selecting a file
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // -----------------------------
  //  Formatting logic (B, I, U) for TEXT mode only
  // -----------------------------
  const applyFormatting = (field, openSyntax, closeSyntax = openSyntax) => {
    // If front is the field, check frontIsMathMode
    // If back is the field, check that backMode === "text"
    if (
      (field === 'front' && frontIsMathMode) ||
      (field === 'back' && backMode !== 'text')
    ) {
      return; // Do nothing if in a non-text mode
    }

    const textarea =
      field === 'front' ? frontTextAreaRef.current : backTextAreaRef.current;
    const content = field === 'front' ? frontContent : backContent;
    const setContent = field === 'front' ? setFrontContent : setBackContent;

    const { selectionStart, selectionEnd } = textarea;

    if (selectionStart === selectionEnd) {
      // No text selected
      const newText =
        content.substring(0, selectionStart) +
        openSyntax +
        closeSyntax +
        content.substring(selectionEnd);
      setContent(newText);

      setTimeout(() => {
        textarea.focus();
        const cursorPosition = selectionStart + openSyntax.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    } else {
      // Text is selected
      const selectedText = content.substring(selectionStart, selectionEnd);
      const newText =
        content.substring(0, selectionStart) +
        openSyntax +
        selectedText +
        closeSyntax +
        content.substring(selectionEnd);

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

  const handleBoldClick = (field) => {
    applyFormatting(field, '**');
  };

  const handleItalicClick = (field) => {
    applyFormatting(field, '*');
  };

  const handleUnderlineClick = (field) => {
    applyFormatting(field, '<u>', '</u>');
  };

  // Logic for bullet points in TEXT mode
  const handleKeyDown = (e, setContent, content, isMathMode) => {
    // For front: isMathMode = frontIsMathMode
    // For back: isMathMode = (backMode === "math")
    if (isMathMode) return;

    const textArea = e.target;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const value = content;

    // 1) If the pressed key is ' ' (space) and the previous char was '-'
    if (e.key === ' ' && value.substring(start - 1, start) === '-') {
      e.preventDefault();
      const newValue =
        value.substring(0, start - 1) + '• ' + value.substring(end);
      setContent(newValue);
      setTimeout(() => {
        textArea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
    // 2) If user presses Enter after a bullet line
    else if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);

      if (currentLine.startsWith('• ')) {
        e.preventDefault();
        const newValue =
          value.substring(0, start) + '\n• ' + value.substring(end);
        setContent(newValue);
        setTimeout(() => {
          textArea.setSelectionRange(start + 3, start + 3);
        }, 0);
      }
    }
  };

  // Don’t render if modal is hidden and not in closing animation
  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Black Background */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()}
      ></div>

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
          isClosing ? 'animate-pop-down' : 'animate-pop-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-0 text-green-500">{text}</h2>

        {/* =========================
             QUESTION Input (Unchanged)
        ========================== */}
        <div className="mb-6">
          <label
            htmlFor="question"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Question
          </label>

          {/* Formatting Buttons */}
          <div className="mb-2 flex space-x-2">
            <button
              onClick={() => handleBoldClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200"
            >
              <b>B</b>
            </button>
            <button
              onClick={() => handleItalicClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200"
            >
              <i>I</i>
            </button>
            <button
              onClick={() => handleUnderlineClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200"
            >
              <u>U</u>
            </button>
            {/* Toggle Math Mode for question */}
            <button
              onClick={() => setFrontIsMathMode((prev) => !prev)}
              className="bg-gray-100 w-12 h-8 rounded-md hover:bg-gray-200"
              title="Toggle Math Mode"
            >
              Math
            </button>
          </div>

          {/* Actual INPUT: text vs. math */}
          {frontIsMathMode ? (
            // MATH MODE
            <div className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md min-h-[6rem] text-gray-500 dark:text-gray-200">
              <EditableMathField
                latex={frontContent}
                onChange={(mathField) => {
                  setFrontContent(mathField.latex());
                }}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                }}
              />
            </div>
          ) : (
            // TEXT MODE
            <textarea
              ref={frontTextAreaRef}
              id="question"
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(e, setFrontContent, frontContent, frontIsMathMode)
              }
              className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
              placeholder="Enter the question here"
            />
          )}
        </div>

        {/* =========================
             ANSWER Input
        ========================== */}
        <div className="mb-6">
          <label
            htmlFor="answer"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Answer
          </label>

          {/* Formatting Buttons */}
          <div className="mb-2 flex space-x-2">
            {/* If backMode === "text", we can do bold/italic/underline */}
            <button
              onClick={() => handleBoldClick('back')}
              disabled={backMode !== 'text'}
              className={`bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200 ${
                backMode !== 'text' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <b>B</b>
            </button>
            <button
              onClick={() => handleItalicClick('back')}
              disabled={backMode !== 'text'}
              className={`bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200 ${
                backMode !== 'text' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <i>I</i>
            </button>
            <button
              onClick={() => handleUnderlineClick('back')}
              disabled={backMode !== 'text'}
              className={`bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200 ${
                backMode !== 'text' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <u>U</u>
            </button>

            {/* Toggle Math Mode for answer */}
            <button
              onClick={() => setBackMode('math')}
              className={`bg-gray-100 w-12 h-8 rounded-md hover:bg-gray-200 ${
                backMode === 'math' ? 'bg-green-200' : ''
              }`}
              title="Math Mode"
            >
              Math
            </button>

            {/* Toggle Image Mode for answer */}
            <button
              onClick={() => setBackMode('image')}
              className={`bg-gray-100 w-12 h-8 rounded-md hover:bg-gray-200 ${
                backMode === 'image' ? 'bg-green-200' : ''
              }`}
              title="Image Mode"
            >
              Image
            </button>

            {/* (Optionally) a button to go back to text mode */}
            <button
              onClick={() => setBackMode('text')}
              className={`bg-gray-100 w-12 h-8 rounded-md hover:bg-gray-200 ${
                backMode === 'text' ? 'bg-green-200' : ''
              }`}
              title="Text Mode"
            >
              Text
            </button>
          </div>

          {/* Conditional Rendering based on backMode */}
          {backMode === 'math' && (
            <div className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md min-h-[6rem] text-gray-500 dark:text-gray-200">
              <EditableMathField
                latex={backContent}
                onChange={(mathField) => {
                  setBackContent(mathField.latex());
                }}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                }}
              />
            </div>
          )}

          {backMode === 'text' && (
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

          {backMode === 'image' && (
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