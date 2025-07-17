import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { fetchCollections } from '../Collections/CollectionManipulation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddSubject({ isOpen, onClose, onSave, subject, text, user, studyhub = false }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [subjectName, setLocalSubjectName] = useState(subject?.name || '');
    const [subjectColor, setLocalSubjectColor] = useState(subject?.colourText ?? 'red');
    const [subjectIntensity, setSubjectIntensity] = useState(subject?.colourIntensity || 500);
    const [filteredCollections, setFilteredCollections] = useState([]);
    const [collections, setCollections] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState('None');
    const [selectedCollectionId, setSelectedCollectionId] = useState(null);
    const [clickedColor, setClickedColor] = useState(null);
    const [studyhubVisibility, setStudyhubVisibility] = useState(false); // false = private, true = public
    const menuRef = useRef(null);

    const colorOptions = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'slate', 'rose', 'pink', 'fuchsia', 'purple', 'violet', 'indigo', 'blue', 'sky'];
    const colorIntensities = [300, 400, 500, 600, 700, 800];

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Reset fields when opening modal for a new subject
            if (!subject) {
                setLocalSubjectName('');
                setLocalSubjectColor('red');
                setSubjectIntensity(500);
                setSelectedCollection('None');
                setSelectedCollectionId(null);
                setClickedColor(null);
            }
        } else if (!isClosing) {
            setIsVisible(false);
        }
    }, [isOpen, isClosing, subject]);

    useEffect(() => {
        if (subject) {
            setLocalSubjectName(subject.name);
            setLocalSubjectColor(subject.colourText);
            setSubjectIntensity(subject.colourIntensity || 500);

            if (subject.collection_id) {
                const selected = collections.find((collection) => collection.id === subject.collection_id);
                if (selected) {
                    setSelectedCollection(selected.name);
                    setSelectedCollectionId(selected.id);
                }
            } else {
                setSelectedCollection('None');
                setSelectedCollectionId(null);
            }
        }
    }, [subject, collections]);

    useEffect(() => {
        const loadCollections = async () => {
            if (user?.id) {
                const userCollections = await fetchCollections(user.id);
                setCollections(userCollections);
                setFilteredCollections(userCollections);
            }
        };

        loadCollections();
    }, [user]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setClickedColor(null);
            }
        };

        if (clickedColor) {
            document.addEventListener('mousedown', handleOutsideClick);
        } else {
            document.removeEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [clickedColor]);

    useEffect(() => {
        if (isOpen) {
            // If editing a subject with a published property, set it; otherwise default to false (private)
            if (subject && typeof subject.published === 'boolean') {
                setStudyhubVisibility(subject.published);
            } else {
                setStudyhubVisibility(false);
            }
        }
    }, [isOpen, subject]);

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
            if (!studyhub) {
                onSave(subject?.id, subjectName, subjectColor, subjectIntensity, subject?.up_to_index, selectedCollectionId, subject?.pinned, studyhubVisibility);
            } else {
                onSave(subject?.id, subjectName, subjectColor, subjectIntensity, subject?.up_to_index, selectedCollectionId);
            }
            handleClose();
        } else {
            toast.warning("Please add a subject name");
        }
    };

    const handleCollectionSearch = (e) => {
        const value = e.target.value;
        setSelectedCollection(value);

        if (value) {
            const filtered = collections.filter((collection) =>
                collection.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCollections(filtered);
            setShowDropdown(true);
        } else {
            setFilteredCollections(collections);
            setShowDropdown(true);
        }
    };

    const handleSelectCollection = (collection) => {
        setSelectedCollection(collection.name);
        setSelectedCollectionId(collection.id);
        setShowDropdown(false);
    };

    const handleSelectNone = () => {
        setSelectedCollection('None');
        setSelectedCollectionId(null);
        setShowDropdown(false);
    };

    const toggleIntensityMenu = (color) => {
        if (clickedColor === color) {
            setClickedColor(null);
        } else {
            setClickedColor(color);
        }
    };

    const selectIntensity = (color, intensity) => {
        setLocalSubjectColor(color);
        setSubjectIntensity(intensity);
        setClickedColor(null);
    };

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300">
            <ToastContainer position="top-center" autoClose={3000} />

            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose}></div>
            <div className={`flex flex-col justify-between relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl sm:rounded-xl p-8 shadow-2xl shadow-black/30 border border-white/20 w-full h-full sm:w-3/4 sm:max-w-2xl sm:h-auto transform transition-all duration-300 ease-in-out ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}>
                <h2 className="text-3xl font-bold mb-6 text-white">
                    {subject ? "Edit Subject" : text}
                </h2>

                <div className="mb-6">
                    <label htmlFor="subjectName" className="block text-lg font-medium mb-2 text-white/90">
                        Subject Name
                    </label>
                    <input
                        id="subjectName"
                        type="text"
                        value={subjectName}
                        onChange={(e) => setLocalSubjectName(e.target.value)}
                        className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                        placeholder="Enter the subject name here"
                        required
                        disabled={studyhub}
                    />
                </div>

                {!studyhub && (
                    <div className="mb-6 relative">
                        <label htmlFor="collectionDropdown" className="block text-lg font-medium mb-2 text-white/90">
                            Subject Collection
                        </label>
                        <input
                            id="collectionDropdown"
                            type="text"
                            value={selectedCollection}
                            onChange={handleCollectionSearch}
                            onClick={() => setShowDropdown(true)}
                            className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                            placeholder="Search for a collection"
                        />
                        {showDropdown && (
                            <ul className="absolute z-10 mt-1 w-full bg-gray-800 borderborder-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                <li
                                    className="cursor-pointer p-3 hover:bg-gray-600 text-gray-200"
                                    onClick={handleSelectNone}
                                >
                                    None
                                </li>
                                {filteredCollections.map((collection) => (
                                    <li
                                        key={collection.id}
                                        className="cursor-pointer p-3 hover:bg-gray-600 text-gray-200"
                                        onClick={() => handleSelectCollection(collection)}
                                    >
                                        {collection.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Publish to StudyHub */}
                {!studyhub && (
                    <div className="mb-6">
                        <label className="block text-lg font-medium mb-2 text-white/90">
                        Subject Visibility
                        </label>
                        <div className="flex gap-4">
                        {/* Custom radio for Private */}
                        <button
                            type="button"
                            onClick={() => setStudyhubVisibility(false)}
                            className={`flex items-center px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
                            ${studyhubVisibility === false ? 'border-blue-500 bg-black/30' : 'border-white/20 bg-black/20'}
                            `}
                            aria-pressed={studyhubVisibility === false}
                        >
                            <span className={`w-5 h-5 mr-2 flex items-center justify-center rounded-full border transition-colors
                            ${studyhubVisibility === false ? 'border-blue-500 bg-blue-500' : 'border-white/40 bg-transparent'}`}
                            >
                            {studyhubVisibility === false && <span className="w-2.5 h-2.5 bg-white rounded-full block" />}
                            </span>
                            <span className="text-white/90 select-none">Private</span>
                        </button>
                        {/* Custom radio for Public */}
                        <button
                            type="button"
                            onClick={() => setStudyhubVisibility(true)}
                            className={`flex items-center px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
                            ${studyhubVisibility === true ? 'border-blue-500 bg-black/30' : 'border-white/20 bg-black/20'}
                            `}
                            aria-pressed={studyhubVisibility === true}
                        >
                            <span className={`w-5 h-5 mr-2 flex items-center justify-center rounded-full border transition-colors
                            ${studyhubVisibility === true ? 'border-blue-500 bg-blue-500' : 'border-white/40 bg-transparent'}`}
                            >
                            {studyhubVisibility === true && <span className="w-2.5 h-2.5 bg-white rounded-full block" />}
                            </span>
                            <span className="text-white/90 select-none">Public</span>
                        </button>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-lg font-medium mb-2 text-white/90">
                        Subject Color
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-4">
                        {colorOptions.map((color) => (
                            <div key={color} className="relative">
                                {clickedColor === color ? (
                                    <div
                                        ref={menuRef}
                                        className="absolute z-20 bg-gray-800 shadow-md rounded-lg p-2 flex flex-col"
                                        style={{ top: '-112px', left: '50%', transform: 'translateX(-50%)' }}
                                    >
                                        {colorIntensities.map((intensity) => (
                                            <button
                                                key={`${color}-${intensity}`}
                                                onClick={() => {
                                                    selectIntensity(color, intensity);
                                                }}
                                                className={`w-12 h-12 rounded-full bg-${color}-${intensity} mb-1`}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => toggleIntensityMenu(color)}
                                        className={`w-12 h-12 rounded-full ${
                                            subjectColor && subjectColor.startsWith(color) ? 'ring-4 ring-gray-400' : ''
                                        } bg-${color}-500`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center sm:flex-row sm:justify-end sm:space-x-4">
                    <BackgroundButton text="Cancel" bgColor="bg-red-500 hover:bg-red-400" wWidth='w-full' onClick={handleClose} />
                    <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" wWidth='w-full mt-2 sm:mt-0' onClick={handleSave} />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddSubject;