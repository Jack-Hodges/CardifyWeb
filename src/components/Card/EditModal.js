import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { Image, Calculator, Text, Brush } from 'lucide-react';
import Drawing from '../Drawing/Drawing'; // Adjust path if needed

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
  const { user } = useUser();

  const [frontContent, setFrontContent] = useState('');
  const [frontMode, setFrontMode] = useState(0);
  const [backContent, setBackContent] = useState('');
  const [backMode, setBackMode] = useState(0);

  // Refs for textareas.
  const frontTextAreaRef = useRef(null);
  const backTextAreaRef = useRef(null);

  // The file to be uploaded (image or exported drawing).
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [drawingSaved, setDrawingSaved] = useState(false);

  // Controls whether the drawing popup is open.
  const [isDrawingPopupOpen, setIsDrawingPopupOpen] = useState(false);

  useEffect(() => {
    setImageUploaded(false);
    setDrawingSaved(false);
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

  // Save handler: passes card data along with the selected file.
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
    }
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

  // Helper for text formatting.
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
      // Check if the hyphen is at the start of a line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      // Only convert to bullet if the hyphen is the only character on the line
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

  // When the drawing popup saves a drawing, set the file.
  const handleDrawingSave = (file) => {
    setSelectedFile(file);
    setDrawingSaved(true);
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
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={(e) => e.stopPropagation()} />
      <div
        className={`relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/30 p-8 rounded-lg w-full sm:w-3/4 sm:max-w-2xl h-full sm:h-auto transform transition-all duration-300 ease-in-out ${
          isClosing ? 'animate-pop-down' : 'animate-pop-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mt-20 sm:mt-0 text-3xl font-bold mb-6 text-white/90">{text}</h2>

        {/* Front (Question) */}
        <div className="mb-6">
          <label htmlFor="question" className="block text-lg font-medium mb-2 text-white/90">
            Question
          </label>
          <div className="mb-2 flex space-x-2 overflow-x-auto scrollbar-hide">
            <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={frontMode} modeText="front" />
            <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={frontMode} modeText="front" />
            <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={frontMode} modeText="front" />
            <EditButton mode={frontMode} setMode={setFrontMode} svg={<Text />} text="Text" val={0} extend />
            <EditButton mode={frontMode} setMode={setFrontMode} svg={<Calculator />} text="Math" val={1} extend />
          </div>
          {frontMode === 1 && (
            <div className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors min-h-[6rem]">
              <EditableMathField
                latex={frontContent}
                onChange={(mathField) => setFrontContent(mathField.latex())}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  border: 'none'
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
              className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors resize-none h-24"
              placeholder="Enter the question here"
            />
          )}
          {frontMode === 2 && (
            <div className="mt-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors" 
              />
              <p className="text-sm text-white/90 mt-2">(Upload an image for the question)</p>
            </div>
          )}
        </div>

        {/* Back (Answer) */}
        <div className="mb-6">
          <label htmlFor="answer" className="block text-lg font-medium mb-2 text-white/90">
            Answer
          </label>
          <div className="mb-2 block sm:flex overflow-x-auto">
            <div className="flex space-x-2">
              <TextButton text={<b>B</b>} handleClick={handleBoldClick} mode={backMode} modeText="back" />
              <TextButton text={<i>I</i>} handleClick={handleItalicClick} mode={backMode} modeText="back" />
              <TextButton text={<u>U</u>} handleClick={handleUnderlineClick} mode={backMode} modeText="back" />
            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <EditButton mode={backMode} setMode={setBackMode} svg={<Text />} text="Text" val={0} extend />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Calculator />} text="Math" val={1} extend />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Image />} text="Image" val={2} />
              <EditButton mode={backMode} setMode={setBackMode} svg={<Brush />} text="Draw" val={3} />
            </div>
          </div>
          {backMode === 1 && (
            <div className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors h-24">
              <EditableMathField
                latex={backContent}
                onChange={(mathField) => setBackContent(mathField.latex())}
                style={{
                  minHeight: '4rem',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  border: 'none'
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
              className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors resize-none h-24"
              placeholder="Enter the answer here"
            />
          )}
          {backMode === 2 && (
            <div
              className="w-full h-24 bg-black/20 backdrop-blur-sm rounded-lg flex justify-center items-center cursor-pointer mt-2 border border-white/20 hover:border-white/40 transition-colors"
              onClick={handleBackImageUploadClick}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} ref={backImageInputRef} className="hidden" />
              <div className="flex items-center space-x-2 text-xl font-semibold text-white/90 p-2">
                <Image />
                {imageUploaded ? <h1>Image uploaded</h1> : <h1>Upload an image</h1>}
              </div>
            </div>
          )}
          {backMode === 3 && (
            <div 
              className="w-full h-24 bg-black/20 backdrop-blur-sm rounded-lg flex justify-center items-center cursor-pointer border border-white/20 hover:border-white/40 transition-colors" 
              onClick={openDrawingPopup}
            >
              <div className="flex items-center space-x-2 text-xl font-semibold text-white/90 p-2">
                <Brush />
                {drawingSaved ? <h1>Drawing added</h1> : <h1>Add a drawing</h1>}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute sm:relative bottom-4 left-0 right-0 sm:bottom-0 flex flex-col items-center sm:flex-row sm:justify-end sm:space-x-4">
          <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" wWidth='w-[90%]' onClick={handleClose} />
          <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" wWidth='w-[90%] mt-2 sm:mt-0' onClick={handleSave} />
        </div>

      </div>

      {/* Drawing Popup */}
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
      className={`bg-black/20 backdrop-blur-sm ${extend ? 'w-[4rem]' : 'w-20'} h-8 rounded-lg text-white/90 border border-white/20 hover:border-white/40 transition-colors ${
        mode === val ? 'bg-black/40 border-white/40' : ''
      }`}
    >
      <div className="flex items-center justify-around space-x-2 px-1 text-white/90">
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
      className={`bg-black/20 backdrop-blur-sm w-8 h-8 rounded-lg text-white/90 border border-white/20 hover:border-white/40 transition-colors flex-shrink-0 ${
        mode !== 0 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="text-white/90">{text}</div>
    </button>
  );
}

/**
 * DrawingPopup renders a separate popup that uses the imported DrawingCanvas component.
 * When "Save Drawing" is clicked, it calls exportDrawing() and passes the resulting file.
 */
function DrawingPopup({ onSaveDrawing, onClose }) {
  const canvasRef = useRef();

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
      className="fixed inset-0 flex items-center justify-center z-50 select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white shadow-lg w-full h-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute flex justify-end space-x-2 bottom-2 right-2 z-10">
          <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" onClick={onClose} />
          <BackgroundButton text="Save Drawing" bgColor="bg-blue-500 hover:bg-blue-400" onClick={handleSaveDrawing} />
        </div>
        <div className="w-full h-4/5 mb-2 rounded-2xl p-1 z-0">
          {/* Pass the ref to Drawing */}
          <Drawing ref={canvasRef} />
        </div>
      </div>
    </div>,
    document.body
  );
}