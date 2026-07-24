import React from 'react';
import SafeMarkdown from './SafeMarkdown';
import { EditableMathField } from 'react-mathquill';

export const PDF_CARD_COLORS = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'cream', label: 'Cream', value: '#f1ebe0' },
  { id: 'mist', label: 'Mist', value: '#f9fafb' },
  { id: 'sky', label: 'Sky', value: '#e0f2fe' },
  { id: 'mint', label: 'Mint', value: '#d1fae5' },
  { id: 'lilac', label: 'Lilac', value: '#ede9fe' },
  { id: 'blush', label: 'Blush', value: '#fce7f3' },
  { id: 'lemon', label: 'Lemon', value: '#fef9c3' },
];

export const PDF_PATTERNS = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'lines', label: 'Lines' },
];

export const PDF_BORDERS = [
  { id: 'none', label: 'None', border: 'none' },
  { id: 'thin', label: 'Thin', border: '1px solid rgba(3,15,64,0.28)' },
  { id: 'medium', label: 'Medium', border: '2px solid rgba(3,15,64,0.55)' },
  { id: 'thick', label: 'Thick', border: '3px solid #030f40' },
  { id: 'dashed', label: 'Dashed', border: '2px dashed rgba(3,15,64,0.45)' },
];

const FIXED_LAYOUT = {
  cardsPerPage: 8,
  columns: 2,
  aspect: '3/2',
  format: 'a4',
  orientation: 'portrait',
};

export const DEFAULT_PDF_OPTIONS = {
  cardColorId: 'mist',
  patternId: 'none',
  borderId: 'thin',
  questionLabelColor: '#3b82f6',
  answerLabelColor: '#eab308',
  showLabels: true,
};

export function resolvePdfOptions(options = {}) {
  const merged = { ...DEFAULT_PDF_OPTIONS, ...options };
  const color =
    PDF_CARD_COLORS.find((c) => c.id === merged.cardColorId) || PDF_CARD_COLORS[2];
  const pattern = PDF_PATTERNS.find((p) => p.id === merged.patternId) || PDF_PATTERNS[0];
  const border = PDF_BORDERS.find((b) => b.id === merged.borderId) || PDF_BORDERS[1];

  return {
    ...merged,
    ...FIXED_LAYOUT,
    cardBg: color.value,
    patternId: pattern.id,
    border: border.border,
  };
}

function getPatternStyle(patternId, cardBg) {
  const base = { backgroundColor: cardBg };
  if (patternId === 'dots') {
    return {
      ...base,
      backgroundImage: 'radial-gradient(circle, rgba(3,15,64,0.14) 1px, transparent 1px)',
      backgroundSize: '12px 12px',
    };
  }
  if (patternId === 'grid') {
    return {
      ...base,
      backgroundImage:
        'linear-gradient(rgba(3,15,64,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(3,15,64,0.08) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
    };
  }
  if (patternId === 'lines') {
    return {
      ...base,
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(3,15,64,0.1) 11px, rgba(3,15,64,0.1) 12px)',
    };
  }
  return base;
}

function getAspectClass(aspect) {
  if (aspect === '1/1') return 'aspect-square';
  if (aspect === '2/3') return 'aspect-[2/3]';
  return 'aspect-[3/2]';
}

function getColumnsClass(columns) {
  if (columns === 3) return 'grid-cols-3';
  if (columns === 1) return 'grid-cols-1';
  return 'grid-cols-2';
}

const getMarkdownFontSizeClass = (text = '', dense = false) => {
  const length = text.length;
  if (dense) {
    if (length > 160) return 'text-[10px]';
    if (length > 90) return 'text-xs';
    if (length > 40) return 'text-sm';
    return 'text-base';
  }
  if (length > 200) return 'text-xs';
  if (length > 120) return 'text-sm';
  if (length > 60) return 'text-base';
  return 'text-lg';
};

const getMathFontSizeValue = (latex = '', dense = false) => {
  const length = latex.length;
  if (dense) {
    if (length > 120) return '0.7rem';
    if (length > 60) return '0.8rem';
    if (length > 30) return '0.95rem';
    return '1.05rem';
  }
  if (length > 150) return '0.75rem';
  if (length > 80) return '0.875rem';
  if (length > 40) return '1.0rem';
  return '1.125rem';
};

function PdfCardFace({
  card,
  side,
  label,
  labelColor,
  showLabels,
  cardStyle,
  border,
  aspectClass,
  dense,
}) {
  const isQuestion = side === 'question';
  const isMath = isQuestion ? card.frontMode === 1 : card.backMode === 1;
  const content = isQuestion ? card.question : card.answer;
  const showImage = !isQuestion && !isMath && card.image_url;

  return (
    <div
      className={`${aspectClass} p-4 rounded-2xl flex items-center justify-center relative overflow-hidden`}
      style={{ ...cardStyle, border }}
    >
      {showLabels && (
        <p
          className={`absolute top-0 font-bold mt-2 ${dense ? 'text-sm' : 'text-xl'}`}
          style={{ color: labelColor }}
        >
          {label}
        </p>
      )}
      {isMath ? (
        <div className="text-gray-800 font-bold text-center w-full pt-6">
          <EditableMathField
            latex={content || ''}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: 'inherit',
              border: 'none',
              pointerEvents: 'none',
              fontSize: getMathFontSizeValue(content, dense),
              textAlign: 'center',
              minHeight: '2.5rem',
            }}
          />
        </div>
      ) : showImage ? (
        <div className="text-gray-800 font-bold text-center w-full flex items-center justify-center pt-6">
          <img
            src={card.image_url}
            alt={label}
            className="max-w-full max-h-[85%] object-contain"
          />
        </div>
      ) : (
        <div className="text-gray-800 font-bold text-center w-full pt-6">
          <SafeMarkdown
            components={{
              u: ({ node, ...props }) => <u {...props} />,
            }}
            className={`${getMarkdownFontSizeClass(content, dense)} text-gray-800 font-bold text-center`}
          >
            {content || ''}
          </SafeMarkdown>
        </div>
      )}
    </div>
  );
}

function PdfPageShell({ preview, label, children }) {
  if (!preview) return children;
  return (
    <div className="bg-white rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.28)] overflow-hidden border border-black/10">
      <div className="px-3 py-1.5 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide border-b border-black/5">
        {label}
      </div>
      {children}
    </div>
  );
}

/** Printable layout used by html2pdf (and live preview in ExportModal). */
export function FlashcardPDFDocument({
  flashcards = [],
  contentRef,
  options = DEFAULT_PDF_OPTIONS,
  preview = false,
  maxChunks,
}) {
  const resolved = resolvePdfOptions(options);
  const cardStyle = getPatternStyle(resolved.patternId, resolved.cardBg);
  const aspectClass = getAspectClass(resolved.aspect);
  const columnsClass = getColumnsClass(resolved.columns);
  const dense = resolved.cardsPerPage >= 10 || preview;

  const chunkedFlashcards = [];
  for (let i = 0; i < flashcards.length; i += resolved.cardsPerPage) {
    chunkedFlashcards.push(flashcards.slice(i, i + resolved.cardsPerPage));
  }

  const visibleChunks =
    typeof maxChunks === 'number'
      ? chunkedFlashcards.slice(0, Math.max(1, maxChunks))
      : chunkedFlashcards;

  const gridPad = preview ? 'gap-2 p-2.5' : 'gap-4 p-4 mt-6';

  return (
    <div
      ref={contentRef}
      className={preview ? 'space-y-3' : undefined}
      style={preview ? undefined : { background: '#ffffff' }}
    >
      {visibleChunks.map((chunk, pageIndex) => (
        <React.Fragment key={`page-${pageIndex}`}>
          <PdfPageShell
            preview={preview}
            label={`Page ${pageIndex * 2 + 1} · Questions`}
          >
            <div className={`grid ${columnsClass} ${gridPad}`}>
              {chunk.map((card, index) => (
                <PdfCardFace
                  key={`q-${card.id || index}`}
                  card={card}
                  side="question"
                  label="Question"
                  labelColor={resolved.questionLabelColor}
                  showLabels={resolved.showLabels}
                  cardStyle={cardStyle}
                  border={resolved.border}
                  aspectClass={aspectClass}
                  dense={dense}
                />
              ))}
            </div>
          </PdfPageShell>

          {!preview && <div className="break-after-page" />}

          <PdfPageShell
            preview={preview}
            label={`Page ${pageIndex * 2 + 2} · Answers`}
          >
            <div className={`grid ${columnsClass} ${gridPad}`}>
              {chunk.map((card, index) => (
                <PdfCardFace
                  key={`a-${card.id || index}`}
                  card={card}
                  side="answer"
                  label="Answer"
                  labelColor={resolved.answerLabelColor}
                  showLabels={resolved.showLabels}
                  cardStyle={cardStyle}
                  border={resolved.border}
                  aspectClass={aspectClass}
                  dense={dense}
                />
              ))}
            </div>
          </PdfPageShell>

          {!preview && pageIndex < visibleChunks.length - 1 && (
            <div className="break-after-page" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function generateFlashcardPDF(
  element,
  subjectName = 'flashcards',
  options = DEFAULT_PDF_OPTIONS
) {
  if (!element) {
    return Promise.reject(new Error('PDF content not ready'));
  }

  const resolved = resolvePdfOptions(options);
  const filename = `${String(subjectName || 'flashcards')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'flashcards'}.pdf`;

  const opt = {
    margin: resolved.orientation === 'landscape' ? 8 : 10,
    filename,
    pagebreak: { mode: 'css' },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: resolved.format,
      orientation: resolved.orientation,
    },
  };

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().set(opt).from(element).save();
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 400);
  });
}

export default function FlashcardPDFExport() {
  return null;
}
