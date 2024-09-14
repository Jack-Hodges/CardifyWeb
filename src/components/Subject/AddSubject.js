import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function AddSubject({ isOpen, onClose, onSave, subject, text }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [subjectName, setLocalSubjectName] = useState(subject?.name || '');
    const [subjectColor, setLocalSubjectColor] = useState(subject?.bgCol || 'red');

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else if (!isClosing) {
            setIsVisible(false);
        }
    }, [isOpen, isClosing]);

    useEffect(() => {
        if (subject) {
            setLocalSubjectName(subject.name);
            setLocalSubjectColor(subject.bgCol);
        } else {
            setLocalSubjectName('');
            setLocalSubjectColor('red');
        }
    }, [subject]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            setIsVisible(false);
        }, 300);
    };

    const handleSave = () => {
        onSave(subject?.id, subjectName, subjectColor);
        handleClose();
    };

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose}></div>
            <div className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}>
                <h2 className="text-2xl font-semibold mb-6 text-green-500">
                    {subject ? "Edit Subject" : text}
                </h2>

                <div className="mb-6">
                    <label htmlFor="subjectName" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Name
                    </label>
                    <input
                        id="subjectName"
                        type="text"
                        value={subjectName}
                        onChange={(e) => setLocalSubjectName(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md text-gray-500 dark:text-gray-200"
                        placeholder="Enter the subject name here"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="subjectColor" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Color
                    </label>
                    <select
                        id="subjectColor"
                        value={subjectColor}
                        onChange={(e) => setLocalSubjectColor(e.target.value)}
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

                <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="red" onClick={handleClose} />
                    <BackgroundButton text="Save" bgColor="blue" onClick={handleSave} />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddSubject;