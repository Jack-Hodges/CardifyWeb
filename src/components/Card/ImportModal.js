import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Upload, X, Check, AlertTriangle } from 'lucide-react';
import { useUser } from '../../UserContext';
import { parseImportFile } from './ImportService';
import BackgroundButton from '../Elements/BackgroundButton';

function ImportModal({ isOpen, onClose, onImport, subject }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [previewCards, setPreviewCards] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const fileInputRef = useRef(null);
  const modalRootRef = useRef(null);
  const { theme, profile } = useUser();
  const { shadow } = theme;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (!isClosing) {
      setIsVisible(false);
    }
  }, [isOpen, isClosing]);

  useEffect(() => {
    if (isVisible) {
      // Create modal root element
      const modalRoot = document.createElement('div');
      modalRoot.id = 'import-modal-root';
      document.body.appendChild(modalRoot);
      modalRootRef.current = modalRoot;

      // Create root and render
      const root = createRoot(modalRoot);
      root.render(
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose} />
          <div
            className={`relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/30 p-8 rounded-lg w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
              isClosing ? 'animate-pop-down' : 'animate-pop-up'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold mb-6 text-white/90">Import Flashcards</h2>

            {/* File Upload Section */}
            <div className="mb-6">
              <div
                className="w-full h-32 bg-black/20 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center cursor-pointer border border-white/20 hover:border-white/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv,.txt,.xlsx"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-white/90 mb-2" />
                <p className="text-white/90 text-lg">
                  {loading ? 'Loading...' : 'Click to select a file'}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  Supported formats: JSON, CSV, TXT, XLSX
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {/* Preview Section */}
            {previewCards.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white/90 mb-4">
                  Preview ({previewCards.length} cards)
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewCards.slice(0, 5).map((card, index) => (
                    <div
                      key={index}
                      className="bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/20"
                    >
                      <p className="text-white/90 font-semibold">Q: {card.question}</p>
                      <p className="text-white/70">A: {card.answer}</p>
                    </div>
                  ))}
                  {previewCards.length > 5 && (
                    <p className="text-white/60 text-center">
                      ... and {previewCards.length - 5} more cards
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <BackgroundButton
                text="Cancel"
                bgColor={`bg-red-500 hover:bg-red-400`}
                onClick={handleClose}
              />
              <BackgroundButton
                text={`Import ${previewCards.length > 0 ? `(${previewCards.length})` : ''}`}
                bgColor={`bg-green-500 hover:bg-green-400`}
                onClick={handleImport}
                disabled={previewCards.length === 0}
              />
            </div>

            {/* Card Limit Dialog */}
            {showLimitDialog && (
              <div className="fixed inset-0 flex items-center justify-center z-[60]">
                <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setShowLimitDialog(false)} />
                <div className="relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/30 p-8 rounded-lg w-[90%] sm:w-3/4 max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold text-white/90">Card Limit Warning</h3>
                  </div>
                  <p className="text-white/90 mb-6">
                    You currently have {profile.flashcard_count} cards. Importing all {previewCards.length} cards would exceed your limit of {profile.pro ? '500' : '100'} cards.
                    Would you like to import only the first {Math.max(0, (profile.pro ? 500 : 100) - profile.flashcard_count)} cards and discard the rest?
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowLimitDialog(false)}
                      className="px-4 py-2 rounded-lg bg-black/20 text-white/90 hover:bg-black/30 transition-colors flex items-center"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const maxCards = profile.pro ? 500 : 100;
                        const remainingSpace = maxCards - profile.flashcard_count;
                        const cardsToImport = previewCards.slice(0, remainingSpace);
                        onImport(cardsToImport);
                        handleClose();
                      }}
                      className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Import Partial
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );

      // Cleanup function
      return () => {
        root.unmount();
        if (modalRootRef.current) {
          document.body.removeChild(modalRootRef.current);
        }
      };
    }
  }, [isVisible, isClosing, previewCards, error, loading, showLimitDialog]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setIsVisible(false);
      setPreviewCards([]);
      setError(null);
      setShowLimitDialog(false);
    }, 300);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const cards = await parseImportFile(file);
      setPreviewCards(cards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const maxCards = profile.pro ? 500 : 100;
    const currentCount = profile.flashcard_count || 0;
    
    if (currentCount >= maxCards) {
      setError(`You've reached your maximum card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`);
      return;
    }
    
    if (currentCount + previewCards.length > maxCards) {
      setShowLimitDialog(true);
    } else {
      onImport(previewCards);
      handleClose();
    }
  };

  return null;
}

export default ImportModal; 