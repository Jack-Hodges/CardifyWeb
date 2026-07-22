import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { X, Download, FileText, FileJson, FileSpreadsheet, FileType } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { exportCardsAsCSV, exportCardsAsJSON, exportCardsAsTXT } from '../Functions/exportFlashcards';
import { FlashcardPDFDocument, generateFlashcardPDF } from '../Functions/flashcardPDFExport';
import { toast } from '../Toast';

const FORMATS = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Printable study sheets with questions and answers',
    icon: FileText,
    color: 'bg-red-500',
  },
  {
    id: 'csv',
    label: 'CSV',
    description: 'Spreadsheet-friendly question / answer pairs',
    icon: FileSpreadsheet,
    color: 'bg-green-500',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Full card data for backup or other apps',
    icon: FileJson,
    color: 'bg-blue-500',
  },
  {
    id: 'txt',
    label: 'TXT',
    description: 'Plain text — easy to edit and re-import',
    icon: FileType,
    color: 'bg-orange-500',
  },
];

function ExportModal({ isOpen, onClose, cards = [], subject }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pdfContentRef = useRef(null);
  const closingRef = useRef(false);

  useBodyScrollLock(isVisible || isClosing);

  useEffect(() => {
    if (isOpen) {
      closingRef.current = false;
      setIsVisible(true);
      setIsClosing(false);
      setExporting(false);
    } else {
      setIsVisible(false);
      setIsClosing(false);
      closingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !exporting) handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isVisible, exporting]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (closingRef.current || exporting) return;
    closingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      closingRef.current = false;
      onClose();
    }, 300);
  };

  const subjectName = subject?.name || 'flashcards';

  const handleExport = async (formatId) => {
    if (!cards.length) {
      toast.warning('No cards to export');
      return;
    }
    if (exporting || closingRef.current) return;

    setExporting(true);
    try {
      if (formatId === 'pdf') {
        await generateFlashcardPDF(pdfContentRef.current, subjectName);
      } else if (formatId === 'csv') {
        exportCardsAsCSV(cards, subjectName);
      } else if (formatId === 'json') {
        exportCardsAsJSON(cards, subjectName);
      } else if (formatId === 'txt') {
        exportCardsAsTXT(cards, subjectName);
      }
      toast.success(`Exported as ${formatId.toUpperCase()}`);
      closingRef.current = true;
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        setExporting(false);
        closingRef.current = false;
        onClose();
      }, 300);
    } catch (err) {
      console.error(err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
      setExporting(false);
    }
  };

  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
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
                <Download size={22} className="text-white/90 shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">Export</h2>
              </div>
              <p className="text-sm text-white/60">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                {subject?.name ? ` from ${subject.name}` : ''}
                {' · tap a format to download'}
              </p>
            </div>
            <BackgroundButton
              image={<X size={20} strokeWidth={3} />}
              bgColor="bg-red-500 hover:bg-red-400"
              onClick={handleClose}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-3">
          {FORMATS.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                type="button"
                disabled={exporting}
                onClick={() => handleExport(format.id)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left
                  bg-white dark:bg-gray-700 background-shadow-new background-hover
                  ${exporting ? 'opacity-60 cursor-wait' : ''}`}
              >
                <div className={`w-11 h-11 rounded-full ${format.color} text-white flex items-center justify-center shrink-0`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">{format.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{format.description}</p>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      <div className="hidden">
        <FlashcardPDFDocument flashcards={cards} contentRef={pdfContentRef} />
      </div>
    </div>,
    document.body
  );
}

export default ExportModal;
