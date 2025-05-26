import { useState, useEffect } from 'react';
import { EditableMathField } from 'react-mathquill';
import { useUser } from '../../UserContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import IconButtons from './IconButtons'; 
import EditModal from './EditModal';
import Modal from '../Modal/Modal';

import { Trash2, RefreshCw } from 'lucide-react';

function Card({
  card,
  flipped,
  setFlipped,
  animateFlip,
  cardId,
  onDeleteCard,
  edit,
  practice,
  onUpsertCard,
}) {
  const [modalFrontContent, setModalFrontContent] = useState(card.question);
  const [modalBackContent, setModalBackContent] = useState(card.answer);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    setModalFrontContent(card.question);
    setModalBackContent(card.answer);
  }, [card.question, card.answer]);

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleCardClick = () => {
    if (setFlipped) {
      if (!isDeleteModalOpen) {
        setFlipped(!flipped);
      }
    }
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCard = (event) => {
    if (event) event.stopPropagation();
    onDeleteCard(cardId);
    setIsDeleteModalOpen(false);
  };

  const cancelDelete = (event) => {
    if (event) event.stopPropagation();
    setIsDeleteModalOpen(false);
  };

  var frontAlign = 'text-center';
  var backAlign = 'text-center';
  if (user) {
    frontAlign = user.frontAlign;
    backAlign = user.backAlign;
  }

  return (
    <div
      className="relative h-full w-full"
      onClick={handleCardClick}
      style={{ perspective: '1000px' }}
    >
      <div
        className={`absolute inset-0 transform ${
          animateFlip ? 'transition-transform duration-500 ease-in-out' : ''
        } ${flipped ? 'rotate-y-180' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <CardContent
          cardMode={card.frontMode}
          rotate={'rotateY(0deg)'}
          content={modalFrontContent}
          onClickDelete={handleDeleteClick}
          onClickEdit={handleEditClick}
          edit={edit}
          align={frontAlign}
          practice={practice}
          back={false}
        />

        {/* Back card */}
        <CardContent
          cardMode={card.backMode}
          rotate={'rotateY(180deg)'}
          content={modalBackContent}
          onClickDelete={handleDeleteClick}
          onClickEdit={handleEditClick}
          edit={edit}
          align={backAlign}
          practice={practice}
          back={true}
          imageUrl={card.image_url}
        />
      </div>

      {/* Edit Modal */}
      <EditModal
        card={card}
        isOpen={isModalOpen}
        onClose={handleCancel}
        text="Edit Question and Answer"
        handleUpsertCard={onUpsertCard}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onFirstAction={cancelDelete}
        onSecondAction={confirmDeleteCard}
        text={'Delete Flashcard'}
        mainText={
          'Are you sure you want to delete this item? This action cannot be undone.'
        }
        firstActionText={'Cancel'}
        secondActionText={'Delete'}
      />
    </div>
  );
}

export default Card;

function CardContent ({
  cardMode,
  imageUrl,
  rotate,
  content,
  onClickDelete,
  onClickEdit,
  back,
  edit,
  practice,
  align,
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center 
                  bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl select-none 
                  background-shadow-new text-center`}
      style={{
        backfaceVisibility: 'hidden',
        transform: rotate,
        whiteSpace: 'pre-wrap',
      }}
    >
      {back && (
        <p className="absolute top-0 font-bold text-2xl mt-2 text-yellow-500">
          Answer
        </p>
      )}

      {cardMode === 1 ? (
      // -------------------------
      // CASE A: back=true AND backMode=1
      // Render something special if needed:
      <div className="text-gray-700 dark:text-gray-200">

        <EditableMathField
          latex={content}
          style={{
            minHeight: '4rem',
            width: '100%',
            backgroundColor: 'transparent',
            color: 'inherit',
            border: 'none',
            pointerEvents: 'none',
            fontSize: '2.25rem' /* 36px */,
            fontWeight: 'semibold',
          }}
        />
      </div>
    ) : cardMode === 0 ? (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            u: ({ node, ...props }) => <u {...props} />,
          }}
          className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
          font-bold ${align}`}
        >
          {content}
        </ReactMarkdown>
    ) : imageUrl ? (
      // -------------------------
      // CASE B: back=true AND we have an imageUrl
      <img
        src={imageUrl}
        alt="Answer"
        className="w-full h-[93%] object-contain"
      />
    ) : (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            u: ({ node, ...props }) => <u {...props} />,
          }}
          className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
          font-bold ${align}`}
        >
          {content}
        </ReactMarkdown>
    )}

      {edit && (
        <div>
          <div
            className="absolute top-2 right-2 cursor-pointer text-red-500"
            onClick={onClickDelete}
          >
            {/* Delete Icon */}
            <Trash2 />
          </div>
          <IconButtons onEditClick={onClickEdit} />
        </div>
      )}

      {practice && (
        <div className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 bg-transparent p-1 transition duration-300 absolute bottom-0 right-0 m-2">
          <RefreshCw size="32"/>
        </div>
      )}
    </div>
  );
}