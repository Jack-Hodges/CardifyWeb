import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useUser } from '../../UserContext';
import BackgroundButton from '../Elements/BackgroundButton';

const FlashcardPDFExport = ({ flashcards }) => {
  const contentRef = useRef(null);
  const { theme } = useUser();

  const generatePDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: 'flashcards.pdf',
      pagebreak: { mode: ['avoid-all'] },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Split flashcards into chunks of 8
  const chunkedFlashcards = [];
  for (let i = 0; i < flashcards.length; i += 8) {
    chunkedFlashcards.push(flashcards.slice(i, i + 8));
  }

  return (
    <div>
      <BackgroundButton bgColor={theme ? theme.primary : 'purple'} onClick={() => generatePDF()} text="Export to PDF"/>

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
                    className="aspect-[3/2] bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl flex items-center justify-center"
                  >
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                      unwrapDisallowed={true}
                      components={{
                        u: ({ node, ...props }) => <u {...props} />,
                      }}
                      className="text-xl text-gray-700 dark:text-gray-200 font-bold text-center"
                    >
                      {card.question}
                    </ReactMarkdown>
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
                    className="aspect-[3/2] bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl flex items-center justify-center relative"
                  >
                    <p className={`absolute top-0 font-bold text-2xl mt-2 text-yellow-500`}>
                      Answer
                    </p>
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      allowedElements={['p', 'strong', 'em', 'u', 'i', 'b']}
                      unwrapDisallowed={true}
                      components={{
                        u: ({ node, ...props }) => <u {...props} />,
                      }}
                      className="text-xl text-gray-700 dark:text-gray-200 font-bold text-center"
                    >
                      {card.answer}
                    </ReactMarkdown>
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