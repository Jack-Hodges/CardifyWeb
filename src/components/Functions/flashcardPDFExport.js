import React, { useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { EditableMathField } from 'react-mathquill';
import { useUser } from '../../UserContext';
import BackgroundButton from '../Elements/BackgroundButton';
import { Download } from 'lucide-react';

// Helper function to determine font size class for Markdown based on text length
const getMarkdownFontSizeClass = (text = '') => {
  const length = text.length;
  if (length > 200) return 'text-xs'; // 0.75rem
  if (length > 120) return 'text-sm'; // 0.875rem
  if (length > 60) return 'text-base'; // 1rem
  return 'text-lg'; // 1.125rem (default, slightly smaller than original text-xl)
};

// Helper function to determine font size value for MathJax based on LaTeX string length
const getMathFontSizeValue = (latex = '') => {
  const length = latex.length;
  if (length > 150) return '0.75rem';
  if (length > 80) return '0.875rem';
  if (length > 40) return '1.0rem';
  return '1.125rem'; // Default
};

const FlashcardPDFExport = ({ flashcards }) => {
  const contentRef = useRef(null);
  const { theme } = useUser();
  const { primaryColor } = theme;

  const generatePDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: 'flashcards.pdf',
      pagebreak: { mode: 'css' },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ensure MathJax has time to render
    setTimeout(() => {
      html2pdf().set(opt).from(element).save();
    }, 500); // 500ms delay
  };

  // Split flashcards into chunks of 8
  const chunkedFlashcards = [];
  for (let i = 0; i < flashcards.length; i += 8) {
    chunkedFlashcards.push(flashcards.slice(i, i + 8));
  }

  return (
    <div>
      <BackgroundButton bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'} onClick={() => generatePDF()} text="Export" image={<Download />} flip/>

      {/* Hidden content that will be converted to PDF */}
      <div className="hidden">
        <div ref={contentRef}>
          {chunkedFlashcards.map((chunk, pageIndex) => (
            <div key={`page-${pageIndex}`} className="mb-8">
              {/* Questions page */}
              <div className="grid grid-cols-2 gap-4 p-4">
                {chunk.map((card, index) => (
                  <div
                    key={`q-${index}`}
                    className="aspect-[3/2] bg-gray-50 p-5 rounded-2xl flex items-center justify-center"
                  >
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
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                        unwrapDisallowed={true}
                        components={{
                          u: ({ node, ...props }) => <u {...props} />,
                        }}
                        className={`${getMarkdownFontSizeClass(card.question)} text-gray-700 font-bold text-center`}
                      >
                        {card.question}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
              </div>

              {/* Force page break */}
              <div className="break-after-page"></div>

              {/* Answers page */}
              <div className="grid grid-cols-2 gap-4 p-4">
                {chunk.map((card, index) => (
                  <div
                    key={`a-${index}`}
                    className="aspect-[3/2] bg-gray-50 p-5 rounded-2xl flex items-center justify-center relative"
                  >
                    <p className={`absolute top-0 font-bold text-2xl mt-2 text-yellow-500`}>
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
                      <img
                        src={card.image_url}
                        alt="Answer"
                        className="max-w-full max-h-[85%] object-contain"
                      />
                    ) : (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                        unwrapDisallowed={true}
                        components={{
                          u: ({ node, ...props }) => <u {...props} />,
                        }}
                        className={`${getMarkdownFontSizeClass(card.answer)} text-gray-700 font-bold text-center`}
                      >
                        {card.answer}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
              </div>

              {/* Force page break before next set */}
              {pageIndex < chunkedFlashcards.length - 1 && (
                <div className="break-after-page"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardPDFExport;