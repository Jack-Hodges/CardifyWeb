import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { useUser } from '../../UserContext';
import { parseImportFile } from '../Card/ImportService';
import BackgroundButton from '../Elements/BackgroundButton';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import ConfirmModal from './ConfirmModal';

function ImportModal({ isOpen, onClose, onImport, subject }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [previewCards, setPreviewCards] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const fileInputRef = useRef(null);
  const { profile } = useUser();

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
      if (e.key === 'Escape' && !showLimitDialog) handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isVisible, showLimitDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = (opts = {}) => {
    if (isClosing || loading) return;
    if (!opts.skipConfirm && previewCards.length > 0) {
      const discard = window.confirm('You have unsaved import preview. Discard it?');
      if (!discard) return;
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
      setPreviewCards([]);
      setError(null);
      setShowLimitDialog(false);
    }, 300);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const cards = await parseImportFile(file);
      setPreviewCards(cards);
    } catch (err) {
      setError(err.message);
      setPreviewCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!profile) {
      setError('Profile is still loading. Try again in a moment.');
      return;
    }

    const maxCards = profile.pro ? 500 : 100;
    const currentCount = profile.flashcard_count || 0;

    if (currentCount >= maxCards) {
      setError(`You've reached your maximum card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`);
      return;
    }

    if (currentCount + previewCards.length > maxCards) {
      setShowLimitDialog(true);
    } else {
      setLoading(true);
      try {
        await onImport(previewCards);
        handleClose({ skipConfirm: true });
      } catch (err) {
        setError(err.message || 'Import failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemovePreviewCard = (index) => {
    setPreviewCards((current) => current.filter((_, i) => i !== index));
  };

  const maxCards = profile?.pro ? 500 : 100;
  const remainingSpace = Math.max(0, maxCards - (profile?.flashcard_count || 0));

  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className={`relative w-full sm:max-w-2xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden flex flex-col
          bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
          sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
          ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Upload size={22} className="text-white/90 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">Import</h2>
              </div>
              <p className="text-sm text-white/60">
                {subject?.name ? `Add cards to ${subject.name}` : 'Bring cards in from a file'}
              </p>
            </div>
            <BackgroundButton
              image={<X size={20} strokeWidth={3} />}
              bgColor="bg-red-500 hover:bg-red-400"
              onClick={handleClose}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 space-y-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[8rem] rounded-2xl flex flex-col justify-center items-center gap-2
              bg-white dark:bg-gray-700 background-shadow-new background-hover cursor-pointer px-4 py-6"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.csv,.txt,.xlsx"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-700 dark:text-white" />
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {loading ? 'Reading file...' : 'Click to select a file'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              JSON, CSV, TXT, or XLSX
            </p>
          </button>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-400/40">
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          )}

          {previewCards.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white/90 mb-3 ml-1">
                Preview · {previewCards.length} {previewCards.length === 1 ? 'card' : 'cards'}
                <span className="font-medium text-white/50"> · tap × to exclude</span>
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {previewCards.map((card, index) => (
                  <div
                    key={`${index}-${card.question?.slice(0, 24) || 'card'}`}
                    className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 flex items-start gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate">Q: {card.question}</p>
                      <p className="text-white/70 truncate">A: {card.answer}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove card ${index + 1}`}
                      onClick={() => handleRemovePreviewCard(index)}
                      className="shrink-0 mt-0.5 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-red-500/80 transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
          <div className="flex sm:justify-end">
            <BackgroundButton
              text={previewCards.length > 0 ? `Import (${previewCards.length})` : 'Import'}
              bgColor={previewCards.length === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400'}
              wWidth="w-full sm:w-auto"
              onClick={handleImport}
              disabled={previewCards.length === 0}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        onConfirm={async () => {
          const cardsToImport = previewCards.slice(0, remainingSpace);
          setShowLimitDialog(false);
          setLoading(true);
          try {
            await onImport(cardsToImport);
            handleClose({ skipConfirm: true });
          } catch (err) {
            setError(err.message || 'Import failed');
          } finally {
            setLoading(false);
          }
        }}
        title="Card limit warning"
        icon={<AlertTriangle size={20} />}
        message={`You have ${profile?.flashcard_count ?? 0} cards. Importing all ${previewCards.length} would exceed your limit of ${maxCards}. Import the first ${remainingSpace} instead?`}
        confirmText="Import partial"
        confirmColor="bg-green-500 hover:bg-green-400"
      />
    </div>,
    document.body
  );
}

export default ImportModal;
