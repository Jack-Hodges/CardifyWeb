import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function Modal({ isOpen, onFirstAction, onSecondAction, text, mainText, firstActionText, secondActionText, firstActionCol = 'bg-gray-500 hover:bg-gray-400', secondActionCol = 'bg-red-500 hover:bg-red-400', titleCol = 'text-red-500', content}) {
    const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
    const [isClosing, setIsClosing] = useState(false); // State to track if the modal is closing

    // Handle the modal appearing (fade in) when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true); // Show modal and trigger the fade-in
        } else if (!isClosing) {
            setIsVisible(false); // Hide modal after animation if not closing
        }
    }, [isOpen, isClosing]);

    const handleClose = (event) => {
        if (event) {
            event.stopPropagation(); // Only stop propagation if event exists
        }
        setIsClosing(true); // Start the closing animation
        setTimeout(() => {
            setIsClosing(false); // Reset closing state after animation
            setIsVisible(false); // Hide the modal after it fades out
        }, 300); // 300ms to match the duration of the closing animation
    };

    const handleFirstAction = () => {
        onFirstAction();
        handleClose();
    }

    const handleSecondAction = () => {
        onSecondAction();
        handleClose();
    }

    if (!isVisible && !isClosing) return null; // If the modal is not visible and not closing, return nothing

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={onFirstAction} // Close modal if the background is clicked
        >
            {/* Black Background */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onFirstAction} // Ensure clicking inside the modal also doesn't propagate
            ></div>

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-4/5 h-[70%] transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from propagating
            >
                {content}

                {/* Action Buttons */}
                <div className="absolute right-5 bottom-5 sm:flex sm:justify-end sm:space-x-4 items-center mx-auto w-full">
                    <BackgroundButton text={firstActionText} bgColor={firstActionCol} onClick={(e) => handleFirstAction(e)} />
                    <BackgroundButton text={secondActionText} bgColor={secondActionCol} wWidth='w-full mt-2 sm:mt-0' onClick={(e) => handleSecondAction(e)} />
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default Modal;