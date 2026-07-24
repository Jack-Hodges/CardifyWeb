import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import {
  X,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  FileType,
  ChevronLeft,
} from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { exportCardsAsCSV, exportCardsAsJSON, exportCardsAsTXT } from '../Functions/exportFlashcards';
import {
  FlashcardPDFDocument,
  generateFlashcardPDF,
  DEFAULT_PDF_OPTIONS,
  PDF_CARD_COLORS,
  PDF_PATTERNS,
  PDF_BORDERS,
  resolvePdfOptions,
} from '../Functions/flashcardPDFExport';
import { toast } from '../Toast';
import { useUser } from '../../UserContext';

const FORMATS = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Printable study sheets — customise colours & style',
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

const PREVIEW_MAX_CHUNKS = 2;

function OptionChip({ active, onClick, children, swatch }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold
        background-shadow-new background-hover transition-colors
        ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}
    >
      {swatch ? (
        <span
          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
          style={{ background: swatch }}
        />
      ) : null}
      {children}
    </button>
  );
}

function PdfOptionsPanel({ options, setOptions }) {
  const update = (patch) => setOptions((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-white mb-2">Card colour</p>
        <div className="flex flex-wrap gap-2">
          {PDF_CARD_COLORS.map((color) => (
            <OptionChip
              key={color.id}
              active={options.cardColorId === color.id}
              swatch={color.value}
              onClick={() => update({ cardColorId: color.id })}
            >
              {color.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-white mb-2">Pattern</p>
        <div className="flex flex-wrap gap-2">
          {PDF_PATTERNS.map((pattern) => (
            <OptionChip
              key={pattern.id}
              active={options.patternId === pattern.id}
              onClick={() => update({ patternId: pattern.id })}
            >
              {pattern.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-white mb-2">Border</p>
        <div className="flex flex-wrap gap-2">
          {PDF_BORDERS.map((border) => (
            <OptionChip
              key={border.id}
              active={options.borderId === border.id}
              onClick={() => update({ borderId: border.id })}
            >
              {border.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-white mb-2">Label colours</p>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-gray-800 text-xs font-bold background-shadow-new">
            Question
            <input
              type="color"
              value={options.questionLabelColor}
              onChange={(e) => update({ questionLabelColor: e.target.value })}
              className="w-6 h-6 rounded-full border-0 bg-transparent cursor-pointer"
            />
          </label>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-gray-800 text-xs font-bold background-shadow-new">
            Answer
            <input
              type="color"
              value={options.answerLabelColor}
              onChange={(e) => update({ answerLabelColor: e.target.value })}
              className="w-6 h-6 rounded-full border-0 bg-transparent cursor-pointer"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={options.showLabels !== false}
        onClick={() => update({ showLabels: options.showLabels === false })}
        className="w-full flex items-center justify-between gap-3 py-2 text-left text-white"
      >
        <span>
          <span className="block text-sm font-bold">Show labels</span>
          <span className="block text-xs mt-0.5 text-white/70">
            Question / Answer corner labels on each card
          </span>
        </span>
        <span
          className={`relative shrink-0 w-12 h-7 rounded-full border-2 border-white/40
            shadow-[2px_2px_0_0_rgba(0,0,0,0.35)] transition-colors duration-200
            ${options.showLabels !== false ? 'bg-blue-500' : 'bg-white/30'}`}
        >
          <span
            className={`absolute top-1/2 left-0.5 size-5 -translate-y-1/2 rounded-full bg-white
              border-2 border-black/20 transition-transform duration-200 ease-out
              ${options.showLabels !== false ? 'translate-x-[1.375rem] -translate-y-1/2' : 'translate-x-0 -translate-y-1/2'}`}
          />
        </span>
      </button>
    </div>
  );
}

function PdfLivePreview({ cards, options }) {
  const resolved = resolvePdfOptions(options);
  const totalChunks = Math.max(1, Math.ceil(cards.length / resolved.cardsPerPage));
  const previewChunks = Math.min(PREVIEW_MAX_CHUNKS, totalChunks);
  const previewCardCount = Math.min(cards.length, previewChunks * resolved.cardsPerPage);
  const totalPages = totalChunks * 2;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-none mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-white/80">Live preview</p>
        <p className="text-[11px] text-white/50 text-right">
          {totalPages} page{totalPages === 1 ? '' : 's'} total
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-neutral-300/90 p-3 sm:p-4">
        <FlashcardPDFDocument
          flashcards={cards}
          options={options}
          preview
          maxChunks={PREVIEW_MAX_CHUNKS}
        />
        {totalChunks > PREVIEW_MAX_CHUNKS && (
          <p className="mt-3 text-center text-[11px] font-semibold text-gray-600">
            Showing first {previewCardCount} of {cards.length} cards — download includes the full set
          </p>
        )}
      </div>
    </div>
  );
}

function ExportModal({ isOpen, onClose, cards = [], subject }) {
  const { theme } = useUser();
  const { secondaryColor } = theme || {};
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [step, setStep] = useState('formats'); // formats | pdf
  const [pdfOptions, setPdfOptions] = useState(DEFAULT_PDF_OPTIONS);
  const pdfContentRef = useRef(null);
  const closingRef = useRef(false);

  useBodyScrollLock(isVisible || isClosing);

  useEffect(() => {
    if (isOpen) {
      closingRef.current = false;
      setIsVisible(true);
      setIsClosing(false);
      setExporting(false);
      setStep('formats');
      setPdfOptions(DEFAULT_PDF_OPTIONS);
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

  const finishExport = (successMessage) => {
    toast.success(successMessage);
    closingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setExporting(false);
      closingRef.current = false;
      onClose();
    }, 300);
  };

  const handleExport = async (formatId) => {
    if (!cards.length) {
      toast.warning('No cards to export');
      return;
    }
    if (exporting || closingRef.current) return;

    if (formatId === 'pdf') {
      setStep('pdf');
      return;
    }

    setExporting(true);
    try {
      if (formatId === 'csv') exportCardsAsCSV(cards, subjectName);
      else if (formatId === 'json') exportCardsAsJSON(cards, subjectName);
      else if (formatId === 'txt') exportCardsAsTXT(cards, subjectName);
      finishExport(`Exported as ${formatId.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
      setExporting(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!cards.length || exporting || closingRef.current) return;
    setExporting(true);
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await generateFlashcardPDF(pdfContentRef.current, subjectName, pdfOptions);
      finishExport('Exported as PDF');
    } catch (err) {
      console.error(err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
      setExporting(false);
    }
  };

  if (!isVisible && !isClosing) return null;

  const isPdfStep = step === 'pdf';

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className={`relative w-full h-full sm:h-auto sm:max-h-[92vh] overflow-hidden flex flex-col
          bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
          sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
          ${isPdfStep ? 'sm:max-w-5xl lg:max-w-6xl' : 'sm:max-w-lg'}
          ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isPdfStep ? (
                  <button
                    type="button"
                    onClick={() => setStep('formats')}
                    className="text-white/90 hover:text-white"
                    aria-label="Back to formats"
                  >
                    <ChevronLeft size={22} />
                  </button>
                ) : (
                  <Download size={22} className="text-white/90 shrink-0" />
                )}
                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {isPdfStep ? 'PDF style' : 'Export'}
                </h2>
              </div>
              <p className="text-sm text-white/60">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                {subject?.name ? ` from ${subject.name}` : ''}
                {isPdfStep ? ' · preview updates as you customise' : ' · tap a format to download'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPdfStep && (
                <BackgroundButton
                  text={exporting ? '…' : 'Download'}
                  image={<Download size={18} strokeWidth={2.5} />}
                  flip
                  bgColor={
                    theme
                      ? `${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || 'hover:bg-purple-400'}`
                      : 'bg-purple-500 hover:bg-purple-400'
                  }
                  disabled={exporting}
                  onClick={handlePdfDownload}
                />
              )}
              <BackgroundButton
                image={<X size={20} strokeWidth={3} />}
                bgColor="bg-red-500 hover:bg-red-400"
                onClick={handleClose}
              />
            </div>
          </div>
        </div>

        {isPdfStep ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            <div className="md:w-[38%] lg:w-[34%] flex-none md:h-full max-h-[42vh] md:max-h-none overflow-y-auto px-5 sm:px-6 py-5 border-b md:border-b-0 md:border-r border-white/15">
              <PdfOptionsPanel options={pdfOptions} setOptions={setPdfOptions} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden px-4 sm:px-5 py-4">
              <PdfLivePreview cards={cards} options={pdfOptions} />
            </div>
          </div>
        ) : (
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
                  <div
                    className={`w-11 h-11 rounded-full ${format.color} text-white flex items-center justify-center shrink-0`}
                  >
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
        )}
      </div>

      {/* Full document for html2pdf — kept off-screen so preview scaling never affects export */}
      <div className="fixed left-[-10000px] top-0 w-[794px] pointer-events-none" aria-hidden="true">
        <FlashcardPDFDocument
          flashcards={cards}
          contentRef={pdfContentRef}
          options={pdfOptions}
        />
      </div>
    </div>,
    document.body
  );
}

export default ExportModal;
