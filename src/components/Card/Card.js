import { useState, useEffect } from 'react';
import Flip from '../../images/icons/flip.png';
import Edit from '../../images/icons/edit.png';

function Card({ frontContent, backContent, flipped, setFlipped, animateFlip, onUpdateCard, currentCardIndex, isEditing, setIsEditing }) {
    const [newFrontContent, setNewFrontContent] = useState(frontContent);
    const [newBackContent, setNewBackContent] = useState(backContent);

    // Update the content when the current card index changes
    useEffect(() => {
        setNewFrontContent(frontContent);
        setNewBackContent(backContent);
    }, [currentCardIndex, frontContent, backContent]);

    const handleEditClick = () => {
        if (isEditing) {
            // Save the edited content when exiting edit mode
            onUpdateCard(currentCardIndex, newFrontContent, newBackContent);
        }
        setIsEditing(!isEditing); // Toggle edit mode
    };

    const handleCardClick = () => {
        if (!isEditing) {
            setFlipped(!flipped);
        }
    };

    return (
        <div
            className="relative h-full w-full"
            onClick={handleCardClick}
            style={{ perspective: '1000px' }}>

            <div
                className={`absolute inset-0 transform ${animateFlip ? 'transition-transform duration-700 ease-in-out' : ''} ${flipped ? 'rotate-y-180' : ''}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>

                {/* Front card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                    }}>

                    {isEditing && !flipped ? (
                        <textarea
                            className="text-4xl w-full h-[87%] mb-4 rounded-lg p-2"
                            value={newFrontContent}
                            onChange={(e) => setNewFrontContent(e.target.value)}
                        />
                    ) : (
                        <p className="text-4xl">{newFrontContent}</p>
                    )}
                    <img src={Edit} alt="Edit" className="w-10 m-2 absolute bottom-0 left-0" onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                    }} />
                    <img src={Flip} alt="Flip" className="w-10 m-2 absolute bottom-0 right-0" />
                </div>

                {/* Back card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}>
                    <p className="absolute top-0 font-bold text-2xl mt-2 bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">Answer</p>

                    {isEditing && flipped ? (
                        <textarea
                            className="text-4xl w-full h-[87%] mb-4 rounded-lg p-2"
                            value={newBackContent}
                            onChange={(e) => setNewBackContent(e.target.value)}
                        />
                    ) : (
                        <p className="text-4xl">{newBackContent}</p>
                    )}
                    <img src={Edit} alt="Edit" className="w-10 m-2 absolute bottom-0 left-0" onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                    }} />
                    <img src={Flip} alt="Flip" className="w-10 m-2 absolute bottom-0 right-0" />
                </div>
            </div>
        </div>
    );
}

export default Card;