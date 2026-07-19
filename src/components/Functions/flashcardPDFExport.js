import React from 'react';
import SafeMarkdown from './SafeMarkdown';
import { EditableMathField } from 'react-mathquill';

const getMarkdownFontSizeClass = (text = '') => {
  const length = text.length;
  if (length > 200) return 'text-xs';
  if (length > 120) return 'text-sm';
  if (length > 60) return 'text-base';
  return 'text-lg';
};

const getMathFontSizeValue = (latex = '') => {
  const length = latex.length;
  if (length > 150) return '0.75rem';
  if (length > 80) return '0.875rem';
  if (length > 40) return '1.0rem';
  return '1.125rem';
};

/** Hidden printable layout used by html2pdf */
export function FlashcardPDFDocument({ flashcards = [], contentRef }) {
  const chunkedFlashcards = [];
  for (let i = 0; i < flashcards.length; i += 8) {
    chunkedFlashcards.push(flashcards.slice(i, i + 8));
  }

  return (
    <div ref={contentRef}>
      {chunkedFlashcards.map((chunk, pageIndex) => (
        <React.Fragment key={`page-${pageIndex}`}>
          <div className="grid grid-cols-2 gap-4 p-4 mt-8">
            {chunk.map((card, index) => (
              <div
                key={`q-${index}`}
                className="aspect-[3/2] bg-gray-50 p-5 rounded-2xl flex items-center justify-center relative"
              >
                <p className="absolute top-0 font-bold text-2xl mt-2 text-blue-500">
                  Question
                </p>
                {card.frontMode === 1 ? (
                  <div className="text-gray-700 font-bold text-center w-full">
                    <EditableMathField
                      latex={card.question}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        color: 'inherit',
                        border: 'none',
                        pointerEvents: 'none',
                        fontSize: getMathFontSizeValue(card.question),
                        textAlign: 'center',
                        minHeight: '2.5rem'
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-700 font-bold text-center w-full">
                    <SafeMarkdown
                                            allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                      unwrapDisallowed={true}
                      components={{
                        u: ({ node, ...props }) => <u {...props} />,
                      }}
                      className={`${getMarkdownFontSizeClass(card.question)} text-gray-700 font-bold text-center`}
                    >
                      {card.question}
                    </SafeMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="break-after-page"></div>

          <div className="grid grid-cols-2 gap-4 p-4 mt-8">
            {chunk.map((card, index) => (
              <div
                key={`a-${index}`}
                className="aspect-[3/2] bg-gray-50 p-5 rounded-2xl flex items-center justify-center relative"
              >
                <p className="absolute top-0 font-bold text-2xl mt-2 text-yellow-500">
                  Answer
                </p>
                {card.backMode === 1 ? (
                  <div className="text-gray-700 font-bold text-center w-full">
                    <EditableMathField
                      latex={card.answer}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        color: 'inherit',
                        border: 'none',
                        pointerEvents: 'none',
                        fontSize: getMathFontSizeValue(card.answer),
                        textAlign: 'center',
                        minHeight: '2.5rem'
                      }}
                    />
                  </div>
                ) : card.image_url ? (
                  <div className="text-gray-700 font-bold text-center w-full flex items-center justify-center">
                    <img
                      src={card.image_url}
                      alt="Answer"
                      className="max-w-full max-h-[85%] object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-700 font-bold text-center w-full">
                    <SafeMarkdown
                                            allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                      unwrapDisallowed={true}
                      components={{
                        u: ({ node, ...props }) => <u {...props} />,
                      }}
                      className={`${getMarkdownFontSizeClass(card.answer)} text-gray-700 font-bold text-center`}
                    >
                      {card.answer}
                    </SafeMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pageIndex < chunkedFlashcards.length - 1 && (
            <div className="break-after-page"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function generateFlashcardPDF(element, subjectName = 'flashcards') {
  if (!element) {
    return Promise.reject(new Error('PDF content not ready'));
  }

  const filename = `${String(subjectName || 'flashcards')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'flashcards'}.pdf`;

  const opt = {
    margin: 10,
    filename,
    pagebreak: { mode: 'css' },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
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

// Backwards-compatible default (unused once ExportModal is wired)
export default function FlashcardPDFExport() {
  return null;
}
