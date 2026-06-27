import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function Modal({ isOpen, onFirstAction, onSecondAction, text, mainText, firstActionText, secondActionText, firstActionCol = 'bg-gray-500 hover:bg-gray-400', secondActionCol = 'bg-red-500 hover:bg-red-400', titleCol = 'text-white', width = 'w-3/4'}) {
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

    // Close on Escape and lock background scroll while the modal is open
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onFirstAction) onFirstAction();
        };
        document.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onFirstAction]);

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
        // Only allow second action if the button is not disabled
        if (!secondActionCol.includes('cursor-not-allowed')) {
            onSecondAction();
            handleClose();
        }
    }

    if (!isVisible && !isClosing) return null;

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
                className={`flex flex-col justify-between relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-2xl p-8 ${width} transform transition-all duration-300 ease-in-out border border-white/20 shadow-2xl shadow-black/30 ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from propagating
            >
                <h2 className={`text-2xl font-semibold mb-6 ${titleCol}`}>
                    {text}
                </h2>

                <p className="mb-6 text-lg text-white dark:text-gray-200">
                    {mainText}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col items-center sm:flex-row sm:justify-end sm:space-x-4">
                    <BackgroundButton text={firstActionText} bgColor={firstActionCol} wWidth='w-full' onClick={(e) => handleFirstAction(e)} />
                    <BackgroundButton text={secondActionText} bgColor={secondActionCol} wWidth='w-full mt-2 sm:mt-0' onClick={(e) => handleSecondAction(e)} />
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default Modal;