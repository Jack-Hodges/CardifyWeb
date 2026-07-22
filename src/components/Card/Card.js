import { useState, useEffect } from 'react';
import { EditableMathField } from 'react-mathquill';
import { useUser } from '../../UserContext';
import SafeMarkdown from '../Functions/SafeMarkdown';

import IconButtons from './IconButtons'; 
import EditModal from './EditModal';
import ConfirmModal from '../Modals/ConfirmModal';

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
  dataTour,
  lightSurface = false,
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

  const confirmDeleteCard = () => {
    onDeleteCard(cardId);
    setIsDeleteModalOpen(false);
  };

  const cancelDelete = () => {
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
      data-tour={dataTour}
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
          align={frontAlign}
          back={false}
          lightSurface={lightSurface}
        />

        {/* Back card */}
        <CardContent
          cardMode={card.backMode}
          rotate={'rotateY(180deg)'}
          content={modalBackContent}
          align={backAlign}
          back={true}
          imageUrl={card.image_url}
          lightSurface={lightSurface}
        />
      </div>

      {/* Controls stay outside the 3D flip so position (and tour spotlight) stay correct */}
      {edit && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className="absolute top-2 right-2 cursor-pointer text-red-500 pointer-events-auto"
            onClick={handleDeleteClick}
          >
            <Trash2 />
          </div>
          <div className="pointer-events-auto">
            <IconButtons onEditClick={handleEditClick} dataTour="create-edit-pencil" />
          </div>
        </div>
      )}

      {practice && (
        <div
          className={`rounded-md bg-transparent p-1 transition duration-300 absolute bottom-0 right-0 m-2 z-10 ${
            lightSurface
              ? 'hover:bg-gray-200 text-gray-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          <RefreshCw size="32"/>
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        card={card}
        isOpen={isModalOpen}
        onClose={handleCancel}
        text="Edit Question and Answer"
        handleUpsertCard={onUpsertCard}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDeleteCard}
        title="Delete flashcard"
        message="Are you sure you want to delete this card? This can't be undone."
        icon={<Trash2 size={20} />}
        confirmText="Delete"
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
  back,
  align,
  lightSurface = false,
}) {
  const textTone = lightSurface ? 'text-gray-700' : 'text-gray-700 dark:text-gray-200';

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-5 rounded-2xl select-none background-shadow-new text-center ${
        lightSurface ? 'bg-gray-50' : 'bg-gray-50 dark:bg-gray-700'
      }`}
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
      <div className={textTone}>

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
        <SafeMarkdown
                    components={{
            u: ({ node, ...props }) => <u {...props} />,
          }}
          className={`text-xl sm:text-4xl font-bold ${textTone} ${align}`}
        >
          {content}
        </SafeMarkdown>
    ) : imageUrl ? (
      // -------------------------
      // CASE B: back=true AND we have an imageUrl
      <img
        src={imageUrl}
        alt="Answer"
        className="w-full h-[93%] object-contain"
      />
    ) : (
        <SafeMarkdown
                    components={{
            u: ({ node, ...props }) => <u {...props} />,
          }}
          className={`text-xl sm:text-4xl font-bold ${textTone} ${align}`}
        >
          {content}
        </SafeMarkdown>
    )}
    </div>
  );
}