import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function AddSubject({ isOpen, onClose, onSave, subjectName, subjectColor, setSubjectName, setSubjectColor, text }) {
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
        onSave(subjectName, subjectColor); // Pass the updated content back to the parent
        handleClose(); // Close the modal after saving
    };

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
                <h2 className="text-2xl font-semibold mb-6 text-green-500">
                    {text}
                </h2>

                {/* Subject Name Input */}
                <div className="mb-6">
                    <label htmlFor="subjectName" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Name
                    </label>
                    <input
                        id="subjectName"
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)} // Update the subject name
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md text-gray-500 dark:text-gray-200"
                        placeholder="Enter the subject name here"
                    />
                </div>

                {/* Subject Color Dropdown */}
                <div className="mb-6">
                    <label htmlFor="subjectColor" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Color
                    </label>
                    <select
                        id="subjectColor"
                        value={subjectColor}
                        onChange={(e) => setSubjectColor(e.target.value)} // Update the subject color
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md text-gray-500 dark:text-gray-200"
                    >
                        <option value="red">Red</option>
                        <option value="orange">Orange</option>
                        <option value="yellow">Yellow</option>
                        <option value="green">Green</option>
                        <option value="emerald">Emerald</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="violet">Violet</option>
                        <option value="pink">Pink</option>
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="red" onClick={handleClose}/>
                    <BackgroundButton text="Save" bgColor="blue" onClick={handleSave}/>
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default AddSubject;