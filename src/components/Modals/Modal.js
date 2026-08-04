import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

function Modal({ isOpen, onFirstAction, onSecondAction, text, mainText, firstActionText, secondActionText, firstActionCol = 'bg-gray-500 hover:bg-gray-400', secondActionCol = 'bg-red-500 hover:bg-red-400', titleCol = 'text-white', width = 'w-3/4'}) {
    const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
    const [isClosing, setIsClosing] = useState(false); // State to track if the modal is closing

    // Handle the modal appearing (fade in) when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
        } else {
            setIsVisible(false);
            setIsClosing(false);
        }
    }, [isOpen]);

    useBodyScrollLock(isVisible || isClosing);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onFirstAction) onFirstAction();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onFirstAction]);

    const handleFirstAction = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onFirstAction();
        }, 300);
    }

    const handleSecondAction = () => {
        if (secondActionCol.includes('cursor-not-allowed') || isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onSecondAction();
        }, 300);
    }

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
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
                className={`relative flex flex-col max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden
                    bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
                    rounded-none sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
                    transform transition-all duration-300 ease-in-out ${width} ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from propagating
            >
                <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <h2 className={`text-2xl font-semibold ${titleCol}`}>
                        {text}
                    </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 pb-4">
                    <p className="text-lg text-white dark:text-gray-200">
                        {mainText}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex-none px-6 sm:px-8 py-5 border-t border-white/15 bg-black/10">
                    <div className="flex flex-col items-center sm:flex-row sm:justify-end sm:space-x-4">
                        <BackgroundButton text={firstActionText} bgColor={firstActionCol} wWidth='w-full' onClick={(e) => handleFirstAction(e)} />
                        <BackgroundButton text={secondActionText} bgColor={secondActionCol} wWidth='w-full mt-2 sm:mt-0' onClick={(e) => handleSecondAction(e)} />
                    </div>
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default Modal;