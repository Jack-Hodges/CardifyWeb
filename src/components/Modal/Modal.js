import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function Modal({ isOpen, onFirstAction, onSecondAction, text, mainText, firstActionText, secondActionText, firstActionCol = 'gray', secondActionCol = 'red'}) {
    const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
    const [isClosing] = useState(false); // State to track if the modal is closing

    // Handle the modal appearing (fade in) when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true); // Show modal and trigger the fade-in
        } else if (!isClosing) {
            setIsVisible(false); // Hide modal after animation if not closing
        }
    }, [isOpen, isClosing]);

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
                className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-3/4 max-w-md transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from propagating
            >
                <h2 className="text-2xl font-semibold mb-6 text-blue-500">
                    {text}
                </h2>

                <p className="mb-6 text-lg text-gray-500 dark:text-gray-200">
                    {mainText}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <BackgroundButton text={firstActionText} bgColor={firstActionCol} onClick={(e) => onFirstAction(e)} />
                    <BackgroundButton text={secondActionText} bgColor={secondActionCol} onClick={(e) => onSecondAction(e)} />
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default Modal;