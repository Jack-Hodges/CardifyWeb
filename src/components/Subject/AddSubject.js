import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { getColor } from '../Functions/getColor';
import { fetchCollections } from '../Collections/CollectionManipulation';

function AddSubject({ isOpen, onClose, onSave, subject, text, user }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [subjectName, setLocalSubjectName] = useState(subject?.name || '');
    const [subjectColor, setLocalSubjectColor] = useState(subject?.bgCol || 'red');
    const [filteredCollections, setFilteredCollections] = useState([]);
    const [collections, setCollections] = useState([]); // New state for collections
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState('None'); // Default selection to "None"
    const [selectedCollectionId, setSelectedCollectionId] = useState(null); // Default to null for "None"

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

    // Fetch collections when the component mounts or when the user changes
    useEffect(() => {
        const loadCollections = async () => {
            if (user?.id) {
                const userCollections = await fetchCollections(user.id); // Fetch collections based on the user ID
                setCollections(userCollections); // Set the collections to state
                setFilteredCollections(userCollections); // Initially, all collections are visible
            }
        };

        loadCollections();
    }, [user]);

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
            // Pass null for collectionId if "None" is selected, otherwise pass the selected collection ID
            onSave(subject?.id, subjectName, subjectColor, selectedCollectionId);
            handleClose();
        }
    };

    // Function to filter collections based on user input
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
            setFilteredCollections(collections); // Show all collections if search input is cleared
            setShowDropdown(true);
        }
    };

    const handleSelectCollection = (collection) => {
        setSelectedCollection(collection.name);
        setSelectedCollectionId(collection.id); // Store the collection ID
        setShowDropdown(false); // Hide dropdown after selection
    };

    const handleSelectNone = () => {
        setSelectedCollection('None'); // Select "None"
        setSelectedCollectionId(null); // Set collectionId to null for "None"
        setShowDropdown(false);
    };

    const handleDropdownClick = () => {
        setFilteredCollections(collections); // Show all collections on click
        setShowDropdown(true); // Display the dropdown
    };

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose}></div>
            <div className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-[90%] sm:w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}>
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

                {/* Searchable Dropdown for Collections */}
                <div className="mb-6 relative">
                    <label htmlFor="collectionDropdown" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Collection
                    </label>
                    <input
                        id="collectionDropdown"
                        type="text"
                        value={selectedCollection}
                        onChange={handleCollectionSearch}
                        onClick={handleDropdownClick}
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md text-gray-500 dark:text-gray-200"
                        placeholder="Search for a collection"
                    />

                    {/* Dropdown for filtered collections */}
                    {showDropdown && (
                        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                            <li
                                className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                                onClick={handleSelectNone}
                            >
                                None
                            </li>
                            {filteredCollections.map((collection, index) => (
                                <li
                                    key={index}
                                    className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                                    onClick={() => handleSelectCollection(collection)}
                                >
                                    {collection.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Subject Color
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
                        {colorOptions.map((color) => {
                            const { bgClass, hoverClass } = getColor(color);
                            return (
                                <button
                                    key={color}
                                    onClick={() => setLocalSubjectColor(color)}
                                    className={`w-12 h-12 rounded-full ${subjectColor === color ? 'ring-4 ring-gray-300 dark:ring-gray-500' : 'ring-0'} ${bgClass} ${hoverClass} transition duration-100`}
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