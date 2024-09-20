import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function EditModal({ isOpen, onClose, onSave, frontContent, backContent, setFrontContent, setBackContent, text, alignment }) {
    const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
    const [isClosing, setIsClosing] = useState(false); // State to track if the modal is closing
    const [selectedAlignment, setSelectedAlignment] = useState(alignment);

    // Handle the modal appearing (fade in) when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true); // Show modal and trigger the fade-in
        } else if (!isClosing) {
            setIsVisible(false); // Hide modal after animation if not closing
        }
    }, [isOpen, isClosing]);

    // Handle close animation
    const handleClose = () => {
        setIsClosing(true); // Start the closing animation
        setTimeout(() => {
            setIsClosing(false); // Reset closing state after animation
            onClose(); // Trigger the actual onClose callback
            setIsVisible(false); // Hide the modal after it fades out
        }, 300); // 300ms to match the duration of the closing animation
    };

    const handleSave = () => {
        onSave(frontContent, backContent); // Pass the updated content back to parent component
        handleClose(); // Close the modal after saving
    };

    const handleAlignmentChange = (newAlignment) => {
        setSelectedAlignment(newAlignment);
    };

    const alignmentButtonStyle = (currentAlignment) =>
        selectedAlignment === currentAlignment ? 'bg-gray-300' : 'bg-white';

    const handleKeyDown = (e, setContent, content) => {
        const textArea = e.target;
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const value = content;
    
        // Check if the pressed key is ' ' (space) and the previous character was '-'
        if (e.key === ' ' && value.substring(start - 1, start) === '-') {
            e.preventDefault(); // Prevent the default action of the space
    
            const newValue = value.substring(0, start - 1) + '• ' + value.substring(end); // Replace '- ' with '• '
    
            setContent(newValue); // Update the content state
    
            setTimeout(() => {
                textArea.setSelectionRange(start + 1, start + 1); // Move the cursor after the bullet point
            }, 0);
    
        } else if (e.key === 'Enter') {
            // Check if the line starts with a bullet point (•) and Enter is pressed
            const lineStart = value.lastIndexOf('\n', start - 1) + 1; // Find the start of the current line
            const currentLine = value.substring(lineStart, start); // Extract the current line's text
    
            if (currentLine.startsWith('• ')) {
                e.preventDefault();
    
                // Insert a new bullet point at the start of the new line
                const newValue = value.substring(0, start) + '\n• ' + value.substring(end);
    
                setContent(newValue);
    
                setTimeout(() => {
                    textArea.setSelectionRange(start + 3, start + 3); // Move the cursor to the new bullet point line
                }, 0);
            }
        }
    };

    const leftBars = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
    );

    const rightBars = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
        </svg>
    );

    const centreBars = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );

    if (!isVisible && !isClosing) return null; // If the modal is not visible and not closing, return nothing

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent modal clicks from triggering the card click
        >
            {/* Black Background */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
            ></div>

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
            >
                <h2 className="text-2xl font-semibold mb-0 text-green-500">{text}</h2>

                <div className="flex gap-2 mb-6">
                    {/* Left Align */}
                    <button
                        className={`flex w-10 h-10 ${alignmentButtonStyle('left')} rounded-lg justify-center items-center`}
                        onClick={() => handleAlignmentChange('left')}
                    >
                        {/* Icon for Left */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                    </button>

                    {/* Center Align */}
                    <button
                        className={`flex w-10 h-10 ${alignmentButtonStyle('center')} rounded-lg justify-center items-center`}
                        onClick={() => handleAlignmentChange('center')}
                    >
                        {/* Icon for Center */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Right Align */}
                    <button
                        className={`flex w-10 h-10 ${alignmentButtonStyle('right')} rounded-lg justify-center items-center`}
                        onClick={() => handleAlignmentChange('right')}
                    >
                        {/* Icon for Right */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                        </svg>
                    </button>
                </div>

                {/* Question Input */}
                <div className="mb-6">
                    <label htmlFor="question" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Question
                    </label>
                    <textarea
                        id="question"
                        value={frontContent}
                        onChange={(e) => setFrontContent(e.target.value)} // Update the front content
                        onKeyDown={(e) => handleKeyDown(e, setFrontContent, frontContent)} // Handle key press events for front content
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
                        placeholder="Enter the question here"
                    />
                </div>

                {/* Answer Input */}
                <div className="mb-6">
                    <label htmlFor="answer" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Answer
                    </label>
                    <textarea
                        id="answer"
                        value={backContent}
                        onChange={(e) => setBackContent(e.target.value)} // Update the back content
                        onKeyDown={(e) => handleKeyDown(e, setBackContent, backContent)} // Handle key press events for back content
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
                        placeholder="Enter the answer here"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="red" onClick={handleClose} />
                    <BackgroundButton text="Save" bgColor="blue" onClick={handleSave} />
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default EditModal;

function TextAlignBox( { img }) {
    <div className="w-10 bg-gray-200 rounded-xl">
        {img}
    </div>
}