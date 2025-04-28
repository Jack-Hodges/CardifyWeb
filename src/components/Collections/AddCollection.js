import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddCollection({ isOpen, onClose, onSave, collection, text, user }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [collectionName, setLocalCollectionName] = useState(collection?.name || '');

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else if (!isClosing) {
            setIsVisible(false);
        }
    }, [isOpen, isClosing]);

    useEffect(() => {
        if (collection) {
            setLocalCollectionName(collection.name);
        }
    }, [collection]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            setIsVisible(false);
        }, 300);
    };

    const handleSave = () => {
        if (collectionName !== '') {
            // Pass null for collectionId if "None" is selected, otherwise pass the selected collection ID
            onSave(collection?.id, user.id, collectionName);
            handleClose();
        } else {
            toast.warning("Please add a collection name");
        }
    };

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>

            <ToastContainer position="top-center" autoClose={3000} />

            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose}></div>
            <div className={`relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-8 w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out border border-white/20 shadow-2xl shadow-black/30 ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}>
                <h2 className="text-2xl font-semibold mb-6 text-green-500">
                    {text}
                </h2>

                <div className="mb-6">
                    <label htmlFor="subjectName" className="block text-lg font-medium mb-2 text-white/90">
                        Collection Name
                    </label>
                    <input
                        id="subjectName"
                        type="text"
                        value={collectionName}
                        onChange={(e) => setLocalCollectionName(e.target.value)}
                        className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                        placeholder="Enter the collection name here"
                        required
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" onClick={handleClose} />
                    <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" onClick={handleSave} />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddCollection;