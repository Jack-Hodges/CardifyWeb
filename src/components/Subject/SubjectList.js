import { useState, useEffect } from 'react';
import { fetchSubjects } from './SubjectManipulation';
import { getColor } from '../Functions/getColor';
import { useNavigate } from 'react-router-dom';
import { fetchCollections } from '../Collections/CollectionManipulation';
import BackgroundButton from '../Elements/BackgroundButton';

function SubjectList({ isOpen, onClose, user, page = "practice" }) {
    const [subjects, setSubjects] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                setLoading(true);
                const [subjectsData, collectionsData] = await Promise.all([
                    fetchSubjects(user.id),
                    fetchCollections(user.id)
                ]);
                setSubjects(subjectsData);
                setCollections(collectionsData);
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    if (!isOpen) return null;
    if (loading) return <div>Loading...</div>;

    // Group subjects by collectionId
    const collectionsWithSubjects = collections.map((collection) => ({
        ...collection,
        subjects: subjects.filter(subject => subject.collection_id === collection.id)
    }));

    // Filter subjects without a collection
    const unassignedSubjects = subjects.filter(subject => subject.collection_id === null);

    // Combine collections and unassigned subjects
    const combinedList = [
        ...unassignedSubjects.map(subject => ({ ...subject, type: 'subject' })), // Mark subjects as type 'subject'
        ...collectionsWithSubjects.map(collection => ({ ...collection, type: 'collection' })) // Mark collections as type 'collection'
    ];

    // Sort the combined list alphabetically by name
    const sortedCombinedList = combinedList.sort((a, b) => a.name.localeCompare(b.name));

    const cross = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[90%] sm:w-4/5 max-w-lg h-4/5 sm:h-[70%] overflow-y-scroll">
                {selectedCollection ? (
                    <CollectionView 
                        collection={selectedCollection} 
                        subjects={selectedCollection.subjects} 
                        onBack={() => setSelectedCollection(null)}
                        onClose={onClose}
                        page={page}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold mb-0 text-green-500">Subjects & Collections</h2>
                            <BackgroundButton image={cross} bgColor={'red'} onClick={onClose}/>
                        </div>

                        {/* Render the sorted combined list */}
                        {sortedCombinedList.map((item) => {
                            if (item.type === 'subject') {
                                return <SubjectRow key={`subject-${item.id}`} subject={item} page={page} onClose={onClose} />;
                            } else if (item.type === 'collection') {
                                return <CollectionRow 
                                    key={`collection-${item.id}`} 
                                    collection={item} 
                                    subjects={item.subjects} 
                                    onClick={() => setSelectedCollection(item)} 
                                />;
                            }
                            return null;
                        })}
                    </>
                )}
            </div>
        </div>
    );
}

export default SubjectList;

function SubjectRow({ subject, page, onClose }) {
    const subjectCol = getColor(subject.bgCol);
    const navigate = useNavigate();

    const handleClick = () => {
        if (page === "create") {
            navigate('/create', { state: { subject } }); // Navigate to the create page with subject
        } else if (page === "practice") {
            navigate('/practice', { state: { subject } }); // Navigate to the practice page with subject
        } else {
            navigate('/match', { state: { subject }}); // Navigate to the match page with subject
        }
        onClose();
    };

    return (
        <div 
            key={subject.id} 
            className={`${subjectCol.bgClass} ${subjectCol.hoverClass} w-full h-16 mb-2 flex justify-between items-center text-white font-bold text-xl px-2 rounded-xl cursor-pointer background-shadow background-hover`}
            onClick={handleClick}>
            <p>{subject.name}</p>
            <p>{subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}</p>
        </div>
    );
}

function CollectionRow({ collection, subjects, onClick }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
    );

    return (
        <div 
            key={collection.id} 
            className="bg-gray-400 w-full h-16 mb-2 flex justify-between items-center text-white font-bold text-xl pl-2 pr-1 rounded-xl cursor-pointer background-shadow background-hover"
            onClick={onClick}>
            <p>{collection.name}</p>
            <div className="flex items-center">
                <p>{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
                {chev}
            </div>
           
        </div>
    );
}

function CollectionView({ collection, subjects, onBack, onClose, page }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

    )

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <BackgroundButton text="Back" image={chev} flip onClick={onBack} />
                <h2 className="text-2xl font-semibold text-green-500">{collection.name}</h2>
            </div>
            {subjects.length > 0 ? (
                subjects.map((subject) => (
                    <SubjectRow key={subject.id} subject={subject} onClose={onClose} page={page}/>
                ))
            ) : (
                <p>No subjects in this collection.</p>
            )}
        </div>
    );
}