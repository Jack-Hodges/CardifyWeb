import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import { ReactSketchCanvas } from 'react-sketch-canvas'; // Ensure you have this installed
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { Image, Calculator, Text, Brush, Eraser, Undo, Redo } from 'lucide-react';

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
            <EditButton mode={frontMode} setMode={setFrontMode} svg={<Text />} text="Text" val={0} extend />
            <EditButton mode={frontMode} setMode={setFrontMode} svg={<Calculator />} text="Math" val={1} extend />
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
            <EditButton mode={backMode} setMode={setBackMode} svg={<Text />} text="Text" val={0} extend />
            <EditButton mode={backMode} setMode={setBackMode} svg={<Calculator />} text="Math" val={1} extend />
            <EditButton mode={backMode} setMode={setBackMode} svg={<Image />} text="Image" val={2} />
            {/* The Draw button opens the separate drawing popup */}
            <EditButton mode={backMode} setMode={setBackMode} svg={<Brush />} text="Draw" val={3} onClick={openDrawingPopup} />
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
      <div className="flex items-center justify-around space-x-2 px-1 text-gray-700">
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
            }}
            canvasColor='transparent'
            strokeColor={brushColor}
          />
        </div>

        <div className="mb-2 flex items-center space-x-4">
            <Brush 
              className={`cursor-pointer ${isEraserMode ? '' : 'bg-gray-100'} hover:bg-gray-200 p-2 w-10 h-10 rounded-lg text-gray-600`}
              onClick={() => {
                setIsEraserMode(false);
                canvasRef.current?.eraseMode(false);
              }}
            />
            <Eraser 
              className={`cursor-pointer ${isEraserMode ? 'bg-gray-100' : ''} hover:bg-gray-200 p-2 w-10 h-10 rounded-lg text-gray-600`}
              onClick={() => {
                setIsEraserMode(true);
                canvasRef.current?.eraseMode(true);
              }}
            />
            <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                class="w-10 h-10 rounded-xl"
              />
            <Undo 
              className={`cursor-pointer hover:bg-gray-200 p-2 w-10 h-10 rounded-lg text-gray-600`}
              onClick={() => {
                canvasRef.current?.undo();
              }}
            />
            <Redo 
              className={`cursor-pointer hover:bg-gray-200 p-2 w-10 h-10 rounded-lg text-gray-600`}
              onClick={() => {
                setIsEraserMode(false);
                canvasRef.current?.redo();
              }}
            />
        </div>

        <div className="flex justify-end space-x-2">
          <BackgroundButton text="Clear" bgColor="bg-yellow-500 hover:bg-yellow-400" onClick={() => canvasRef.current.clearCanvas()} />
          <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" onClick={onClose} />
          <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" onClick={handleSaveDrawing} />
        </div>
      </div>
    </div>,
    document.body
  );
}

function DrawingButtons({onClick, bool, asset}) {
  <button
      onClick={() => onClick}
      className={`bg-gray-100 w-8 h-8 rounded-md hover:bg-gray-200 ${
        bool ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {asset}
    </button>
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