import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import { ReactSketchCanvas } from 'react-sketch-canvas'; // Ensure you have this installed
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

  // Front side: 0 = text, 1 = math, 2 = image
  const [frontContent, setFrontContent] = useState('');
  const [frontMode, setFrontMode] = useState(0);
  // Back side: 0 = text, 1 = math, 2 = image
  const [backContent, setBackContent] = useState('');
  const [backMode, setBackMode] = useState(0);

  // Refs for textareas
  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);

  // The file that will eventually be sent (uploaded image or exported drawing)
  const [selectedFile, setSelectedFile] = useState(null);

  // Controls whether the drawing popup is open
  const [isDrawingPopupOpen, setIsDrawingPopupOpen] = useState(false);

  const svgs = {
    text: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    math: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
    image: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
    drawing: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    )
  };

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

  // Called when the user clicks "Save" in the edit modal.
  // This passes the card data along with the file (if any) to your handler.
  const handleSave = async () => {
    const cardToSave = {
      id: card?.id,
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

  // Helper for text formatting (works only in text mode)
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

  // Handle bullet point behavior in text mode
  const handleKeyDown = (e, setContent, content, isMathMode) => {
    if (isMathMode) return;
    const { selectionStart: start, selectionEnd: end } = e.target;
    const value = content;

    if (e.key === ' ' && value.substring(start - 1, start) === '-') {
      e.preventDefault();
      setContent(value.substring(0, start - 1) + '• ' + value.substring(end));
      setTimeout(() => e.target.setSelectionRange(start + 1, start + 1), 0);
      return;
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

  // Opens the drawing popup (separate modal)
  const openDrawingPopup = () => {
    setIsDrawingPopupOpen(true);
  };

  // Callback when the drawing popup saves a drawing.
  const handleDrawingSave = (file) => {
    setSelectedFile(file);
  };

  const closeDrawingPopup = () => {
    setIsDrawingPopupOpen(false);
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
          <div className="mb-2 flex space-x-2">
            <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={frontMode} modeText="front" />
            <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={frontMode} modeText="front" />
            <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={frontMode} modeText="front" />
            <EditButton mode={frontMode} setMode={setFrontMode} svg={svgs.text} text="Text" val={0} extend />
            <EditButton mode={frontMode} setMode={setFrontMode} svg={svgs.math} text="Math" val={1} extend />
          </div>
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
              onKeyDown={(e) => handleKeyDown(e, setFrontContent, frontContent, frontMode === 'math')}
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
              <p className="text-sm text-gray-500 mt-2">(Upload an image for the question)</p>
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
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.text} text="Text" val={0} extend />
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.math} text="Math" val={1} extend />
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.image} text="Image" val={2} />
            {/* The Draw button opens the separate drawing popup */}
            <EditButton mode={backMode} setMode={setBackMode} svg={svgs.drawing} text="Draw" val={3} onClick={openDrawingPopup} />
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
              onKeyDown={(e) => handleKeyDown(e, setBackContent, backContent, backMode === 'math')}
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
              <p className="text-sm text-gray-500 mt-2">(Upload an image for the answer)</p>
            </div>
          )}
          {selectedFile && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Drawing saved. (You can re-open the drawing editor to update it.)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" onClick={handleClose} />
          <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" onClick={handleSave} />
        </div>
      </div>

      {/* Render the drawing popup as a separate modal */}
      {isDrawingPopupOpen && (
        <DrawingPopup onSaveDrawing={handleDrawingSave} onClose={closeDrawingPopup} />
      )}
    </div>,
    document.body
  );
}

export default EditModal;

function EditButton({ mode, setMode, svg, text, val, extend, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setMode(val);
  };

  return (
    <button
      onClick={handleClick}
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

function TextButton({ text, handleClick, mode, modeText }) {
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

/**
 * DrawingPopup renders a separate popup for drawing.
 * It includes:
 *  - A ReactSketchCanvas with a transparent background.
 *  - A toggle button to switch between brush and eraser modes.
 *  - A color picker (visible only in brush mode).
 *  - Buttons to clear, save, or cancel.
 */
function DrawingPopup({ onSaveDrawing, onClose }) {
  const canvasRef = useRef();
  const [brushColor, setBrushColor] = useState('#000000');
  const [isEraserMode, setIsEraserMode] = useState(false);

  // When isEraserMode changes, update the canvas context's composite operation.
  useEffect(() => {
    if (
      canvasRef.current &&
      canvasRef.current.canvas &&
      canvasRef.current.canvas.current
    ) {
      const canvas = canvasRef.current.canvas.current;
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'source-over';
    }
  }, [isEraserMode]);

  // When the brush color changes and we're not in eraser mode, update the stroke color.
  useEffect(() => {
    if (!isEraserMode && canvasRef.current) {
      // If needed, you might also call a method to update stroke color.
      // Here, ReactSketchCanvas takes the strokeColor prop.
    }
  }, [brushColor, isEraserMode]);

  // Export the drawing as a PNG (with transparency) and convert it to a File.
  const handleSaveDrawing = async () => {
    try {
      const dataUrl = await canvasRef.current.exportImage('png');
      const file = dataURLtoFile(dataUrl, 'drawing.png');
      onSaveDrawing(file);
      onClose();
    } catch (err) {
      console.error('Failed to export drawing', err);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black opacity-50" />
      <div
        className="relative bg-white p-4 rounded shadow-lg w-[90%] sm:w-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl mb-2">Drawing</h2>
        <div className="mb-2">
          <ReactSketchCanvas
            ref={canvasRef}
            style={{
              border: '1px solid #ccc',
              height: '300px',
              width: '100%',
              background: 'transparent',
              eraserMode: isEraserMode,  
            }}
            strokeColor={brushColor}
          />
        </div>
        <div className="mb-2 flex items-center">
          <button
            onClick={() => setIsEraserMode(!isEraserMode)}
            className="mr-4 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {isEraserMode ? 'Switch to Brush' : 'Switch to Eraser'}
          </button>
          {!isEraserMode && (
            <>
              <label className="mr-2">Brush Color:</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => canvasRef.current.clearCanvas()}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-400"
          >
            Clear
          </button>
          <button
            onClick={handleSaveDrawing}
            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-400"
          >
            Save Drawing
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Helper function to convert a data URL to a File object.
 */
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}