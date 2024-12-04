import { useState, useEffect } from 'react';
import { fetchSubjects } from './SubjectManipulation';
import { getColor } from '../Functions/getColor';
import { useNavigate } from 'react-router-dom';
import { fetchCollections } from '../Collections/CollectionManipulation';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';

function SubjectList({ isOpen, onClose, user, page = "practice" }) {
    const [subjects, setSubjects] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const { theme } = useUser();

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
                        cross={cross}
                        theme={theme}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold mb-0 text-green-500">Subjects & Collections</h2>
                            <BackgroundButton image={cross} bgColor={'bg-red-500 hover:bg-red-400'} onClick={onClose}/>
                        </div>

                        {/* Render the sorted combined list */}
                        {sortedCombinedList.map((item) => {
                            if (item.type === 'subject') {
                                return <SubjectRow key={`subject-${item.id}`} subject={item} page={page} onClose={onClose} themeShadow={theme ? theme.shadowClass : 'background-shadow'}/>;
                            } else if (item.type === 'collection') {
                                return <CollectionRow 
                                    key={`collection-${item.id}`} 
                                    collection={item} 
                                    subjects={item.subjects} 
                                    onClick={() => setSelectedCollection(item)} 
                                    themeShadow={theme ? theme.shadowClass : 'background-shadow'}
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

function SubjectRow({ subject, page, onClose, themeShadow = 'background-shadow' }) {
    const subjectCol = getColor(subject.bgCol);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/${page}`, { state: { subject } });
        onClose();
    };

    return (
        <div 
            key={subject.id} 
            className={`${subjectCol.bgClass} ${subjectCol.hoverClass} w-full h-16 mb-2 justify-between items-center text-white font-bold text-xl px-2 rounded-xl cursor-pointer ${themeShadow} background-hover`}
            onClick={handleClick}>
            <p className="text-2xl">{subject.name}</p>
            <p className="text-lg font-normal">{subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}</p>
        </div>
    );
}

function CollectionRow({ collection, subjects, onClick, themeShadow = 'background-shadow' }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
    );

    return (
        <div 
            key={collection.id} 
            className={`bg-gray-400 w-full h-16 mb-2 flex justify-between items-center text-white font-bold text-xl pl-2 pr-1 rounded-xl cursor-pointer ${themeShadow} background-hover`}
            onClick={onClick}>
            <div>
                <p className="text-2xl">{collection.name}</p>
                <p className="text-lg font-normal">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
            </div>
                {chev}
           
        </div>
    );
}

function CollectionView({ collection, subjects, onBack, onClose, page, cross, theme }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

    )

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <BackgroundButton text={collection.name} image={chev} flip onClick={onBack} bgColor={'bg-green-500 hover:bg-green-400'}/>
                <BackgroundButton image={cross} bgColor={'bg-red-500 hover:bg-red-400'} onClick={onClose}/>
            </div>
            {subjects.length > 0 ? (
                subjects.map((subject) => (
                    <SubjectRow key={subject.id} subject={subject} onClose={onClose} page={page} themeShadow={theme ? theme.shadowClass : 'background-shadow'}/>
                ))
            ) : (
                <p>No subjects in this collection.</p>
            )}
        </div>
    );
}