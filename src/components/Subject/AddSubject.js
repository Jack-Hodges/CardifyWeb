import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { getColor } from '../Functions/getColor';

function AddSubject({ isOpen, onClose, onSave, subject, text }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [subjectName, setLocalSubjectName] = useState(subject?.name || '');
    const [subjectColor, setLocalSubjectColor] = useState(subject?.bgCol || 'red');

    const colorOptions = ['red', 'orange', 'yellow', 'green', 'emerald', 'sky', 'blue', 'purple', 'violet', 'pink'];

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
        if (subjectName !== '') {
            onSave(subject?.id, subjectName, subjectColor);
            handleClose();
        }
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
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Color
                    </label>
                    <div className="grid grid-cols-10 gap-4">
                        {colorOptions.map((color) => {
                            const { bgClass } = getColor(color);
                            return (
                                <button
                                    key={color}
                                    onClick={() => setLocalSubjectColor(color)}
                                    className={`w-12 h-12 rounded-full ${subjectColor === color ? 'ring-4 ring-gray-300 dark:ring-gray-500' : 'ring-0'} ${bgClass} transition duration-100`}
                                />
                            );
                        })}
                    </div>
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