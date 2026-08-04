import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { toast } from '../Toast';

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
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" onClick={handleClose} />
            <div
                className={`relative flex flex-col w-full h-full sm:h-auto sm:max-w-lg max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden
                    bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
                    sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
                    transform transition-all duration-300 ease-in-out
                    ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-none px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b border-white/15">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        {text}
                    </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5">
                    <label htmlFor="collectionName" className="block text-lg font-medium mb-2 text-white/90">
                        Collection Name
                    </label>
                    <input
                        id="collectionName"
                        type="text"
                        value={collectionName}
                        onChange={(e) => setLocalCollectionName(e.target.value)}
                        className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                        placeholder="Enter the collection name here"
                        required
                    />
                </div>

                <div className="flex-none px-5 sm:px-8 py-4 border-t border-white/15 bg-black/10">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" wWidth='w-full sm:w-auto' onClick={handleClose} />
                        <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" wWidth='w-full sm:w-auto' onClick={handleSave} />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddCollection;