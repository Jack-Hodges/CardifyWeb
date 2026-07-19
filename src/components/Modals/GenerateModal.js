import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { X, Sparkles } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

function GenerateModal({ isOpen, onClose, onGenerate, isGenerating }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cardCount, setCardCount] = useState('5');
  const [topic, setTopic] = useState('');

  useBodyScrollLock(isVisible || isClosing);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isGenerating) handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isVisible, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (isClosing || isGenerating) return;
    if (topic.trim() || cardCount !== '5') {
      const discard = window.confirm('Discard your generate settings?');
      if (!discard) return;
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
      setTopic('');
      setCardCount('5');
    }, 300);
  };

  const handleGenerate = () => {
    if (!topic.trim() || isGenerating) return;
    onGenerate(parseInt(cardCount, 10), topic.trim());
  };

  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isGenerating ? undefined : handleClose}
      />
      <div
        className={`relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col
          bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
          sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
          ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={22} className="text-white/90 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">Generate</h2>
              </div>
              <p className="text-sm text-white/60">AI flashcards from a topic</p>
            </div>
            {!isGenerating && (
              <BackgroundButton
                image={<X size={20} strokeWidth={3} />}
                bgColor="bg-red-500 hover:bg-red-400"
                onClick={handleClose}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-purple-400 mb-4" />
              <p className="text-lg font-bold text-white">Generating flashcards...</p>
              <p className="text-sm text-white/55 mt-1">This usually takes a few seconds</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-white/90 mb-2 ml-1">
                  Number of cards
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '5', '10', '20'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCardCount(n)}
                      className={`h-11 rounded-full font-bold background-shadow-new background-hover
                        ${cardCount === n
                          ? 'bg-purple-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="generate-topic" className="block text-sm font-bold text-white/90 mb-2 ml-1">
                  Topic
                </label>
                <input
                  id="generate-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                  placeholder="e.g. Photosynthesis, WWII causes..."
                  className="w-full px-4 py-3 rounded-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                    background-shadow-new background-focus focus:outline-none font-medium
                    placeholder:text-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {!isGenerating && (
          <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
            <div className="flex sm:justify-end">
              <BackgroundButton
                text="Generate"
                bgColor={!topic.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-400'}
                wWidth="w-full sm:w-auto"
                onClick={handleGenerate}
                disabled={!topic.trim()}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default GenerateModal;
