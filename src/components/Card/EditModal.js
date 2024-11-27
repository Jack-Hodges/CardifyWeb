import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

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
  const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
  const [isClosing, setIsClosing] = useState(false); // State to track if the modal is closing

  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);

  // Handle the modal appearing (fade in) when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true); // Show modal and trigger the fade-in
    } else if (!isClosing) {
      setIsVisible(false); // Hide modal after animation if not closing
    }
  }, [isOpen, isClosing]);

  // Handle close animation
  const handleClose = () => {
    setIsClosing(true); // Start the closing animation
    setTimeout(() => {
      setIsClosing(false); // Reset closing state after animation
      onClose(); // Trigger the actual onClose callback
      setIsVisible(false); // Hide the modal after it fades out
    }, 300); // 300ms to match the duration of the closing animation
  };

  const handleSave = () => {
    onSave(frontContent, backContent); // Pass the updated content back to parent component
    handleClose(); // Close the modal after saving
  };

  // Formatting Functions
  const applyFormatting = (field, openSyntax, closeSyntax = openSyntax) => {
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

  const handleKeyDown = (e, setContent, content) => {
    const textArea = e.target;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const value = content;

    // Check if the pressed key is ' ' (space) and the previous character was '-'
    if (e.key === ' ' && value.substring(start - 1, start) === '-') {
      e.preventDefault(); // Prevent the default action of the space

      const newValue =
        value.substring(0, start - 1) + '• ' + value.substring(end); // Replace '- ' with '• '

      setContent(newValue); // Update the content state

      setTimeout(() => {
        textArea.setSelectionRange(start + 1, start + 1); // Move the cursor after the bullet point
      }, 0);
    } else if (e.key === 'Enter') {
      // Check if the line starts with a bullet point (•) and Enter is pressed
      const lineStart = value.lastIndexOf('\n', start - 1) + 1; // Find the start of the current line
      const currentLine = value.substring(lineStart, start); // Extract the current line's text

      if (currentLine.startsWith('• ')) {
        e.preventDefault();

        // Insert a new bullet point at the start of the new line
        const newValue =
          value.substring(0, start) + '\n• ' + value.substring(end);

        setContent(newValue);

        setTimeout(() => {
          textArea.setSelectionRange(start + 3, start + 3); // Move the cursor to the new bullet point line
        }, 0);
      }
    }
  };

  if (!isVisible && !isClosing) return null; // If the modal is not visible and not closing, return nothing

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => e.stopPropagation()} // Prevent modal clicks from triggering the card click
    >
      {/* Black Background */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
      ></div>

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
          isClosing ? 'animate-pop-down' : 'animate-pop-up'
        }`}
        onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
      >
        <h2 className="text-2xl font-semibold mb-0 text-green-500">{text}</h2>

        {/* Question Input */}
        <div className="mb-6">
          <label
            htmlFor="question"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Question
          </label>

          {/* Formatting Buttons for Question */}
          <div className="mb-2 flex space-x-2">
            <button
              onClick={() => handleBoldClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <b>B</b>
            </button>
            <button
              onClick={() => handleItalicClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <i>I</i>
            </button>
            <button
              onClick={() => handleUnderlineClick('front')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <u>U</u>
            </button>
          </div>

          <textarea
            ref={frontTextAreaRef}
            id="question"
            value={frontContent}
            onChange={(e) => setFrontContent(e.target.value)} // Update the front content
            onKeyDown={(e) => handleKeyDown(e, setFrontContent, frontContent)} // Handle key press events for front content
            className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
            placeholder="Enter the question here"
          />
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          <label
            htmlFor="answer"
            className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200"
          >
            Answer
          </label>

          {/* Formatting Buttons for Answer */}
          <div className="mb-2 flex space-x-2">
            <button
              onClick={() => handleBoldClick('back')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <b>B</b>
            </button>
            <button
              onClick={() => handleItalicClick('back')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <i>I</i>
            </button>
            <button
              onClick={() => handleUnderlineClick('back')}
              className="bg-gray-100 w-8 h-8 rounded-md sm:hover:bg-gray-200"
            >
              <u>U</u>
            </button>
          </div>

          <textarea
            ref={backTextAreaRef}
            id="answer"
            value={backContent}
            onChange={(e) => setBackContent(e.target.value)} // Update the back content
            onKeyDown={(e) => handleKeyDown(e, setBackContent, backContent)} // Handle key press events for back content
            className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
            placeholder="Enter the answer here"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" onClick={handleClose} />
          <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" onClick={handleSave} />
        </div>
      </div>
    </div>,
    document.body // Render the modal into the body of the document
  );
}

export default EditModal;