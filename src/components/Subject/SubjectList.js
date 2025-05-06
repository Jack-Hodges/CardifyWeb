import { useState, useEffect } from 'react';
import { fetchSubjects, saveSubject, removeSubject } from './SubjectManipulation';
import getColors from '../Functions/getColors';
import { useNavigate } from 'react-router-dom';
import { fetchCollections } from '../Collections/CollectionManipulation';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import AddSubject from '../Subject/AddSubject';
import { X, Plus, MoreVertical } from 'lucide-react';

function SubjectList({ isOpen, onClose, user, page = "practice" }) {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const { theme } = useUser();
    const { secondaryColor } = theme;
    const [confirmDeleteSubject, setConfirmDeleteSubject] = useState(null);


    const handleRemove = async (id) => {
      await removeSubject(id);
      const refreshed = await fetchSubjects(user.id);
      setSubjects(refreshed);
    };

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

    const goToDashboard = () => {
        navigate('/dashboard');
    }

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-6 w-[90%] sm:w-4/5 max-w-lg h-4/5 sm:h-[70%] overflow-y-scroll shadow-2xl shadow-black/30 border border-white/20">
            {selectedCollection ? (
              <CollectionView 
                collection={selectedCollection} 
                subjects={selectedCollection.subjects} 
                onBack={() => setSelectedCollection(null)}
                onClose={onClose}
                page={page}
                theme={theme}
                onEditSubject={(subj) => { setEditingSubject(subj); setIsAddOpen(true); }}
                onDeleteSubject={(subj) => setConfirmDeleteSubject(subj)}
              />
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold mb-0 text-white/90">Subjects & Collections</h2>
                  <div className="flex gap-2">
                    <BackgroundButton image={<Plus/>} bgColor={'bg-green-500 hover:bg-green-400'} onClick={() => { setEditingSubject(null); setIsAddOpen(true); }}/>
                    <BackgroundButton image={<X/>} bgColor={'bg-red-500 hover:bg-red-400'} onClick={onClose}/>
                  </div>
                </div>
      
                {subjects.length > 0 ? (
                  sortedCombinedList.map((item) => {
                    if (item.type === 'subject') {
                      return (
                        <SubjectRow
                          key={`subject-${item.id}`}
                          subject={item}
                          page={page}
                          onClose={onClose}
                          themeShadow={'background-shadow-new'}
                          onEdit={() => { setEditingSubject(item); setIsAddOpen(true); }}
                          onDelete={() => setConfirmDeleteSubject(item)}
                        />
                      );
                    } else if (item.type === 'collection') {
                      return (
                        <CollectionRow 
                          key={`collection-${item.id}`} 
                          collection={item} 
                          subjects={item.subjects} 
                          onClick={() => setSelectedCollection(item)} 
                          themeShadow={'background-shadow-new'}
                        />
                      );
                    }
                    return null;
                  })
                ) : (
                  <div className="text-center text-lg text-gray-500 mt-10 flex flex-col items-center">
                    <p className="mb-3">You have no subjects yet</p>
                    <BackgroundButton text="Go to Dashboard" onClick={goToDashboard} bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : `bg-purple-500 hover:bg-purple-400`}/>
                  </div>
                  
                )}
              </>
            )}
          </div>
          <AddSubject
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSave={async (subjectId, name, colourText, colourIntensity, upToIndex, collectionId) => {
              // save or update subject
              await saveSubject(
                subjectId,
                name,
                colourText,
                colourIntensity,
                user.id,
                upToIndex,
                collectionId,
                false // pinned default
              );
              // reload list
              const refreshed = await fetchSubjects(user.id);
              setSubjects(refreshed);
              setIsAddOpen(false);
            }}
            subject={editingSubject}
            text={editingSubject ? 'Edit Subject' : 'Add New Subject'}
            user={user}
          />
          {confirmDeleteSubject && (
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-6 w-[80%] sm:w-1/2 max-w-md mx-auto shadow-2xl shadow-black/30 border border-white/20 z-50">
                <p className="text-white text-xl mb-4">Do you really want to delete "{confirmDeleteSubject.name}"?</p>
                <div className="flex justify-end space-x-4">
                  <BackgroundButton
                    text="Cancel"
                    bgColor="bg-gray-500 hover:bg-gray-400"
                    onClick={() => setConfirmDeleteSubject(null)}
                  />
                  <BackgroundButton
                    text="Delete"
                    bgColor="bg-red-500 hover:bg-red-400"
                    onClick={() => { handleRemove(confirmDeleteSubject.id); setConfirmDeleteSubject(null); }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
}

export default SubjectList;

function SubjectRow({ subject, page, onClose, themeShadow = 'background-shadow-new', onEdit, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const subjectCol = getColors([subject.colourText, subject.colourIntensity]);
    const navigate = useNavigate();

    return (
      <div className={`relative mb-2`}>
        <div 
          className={`${subjectCol.bgClass} ${themeShadow} w-full h-16 flex justify-between items-center text-white font-bold text-xl px-2 rounded-xl cursor-pointer background-hover`}
          onClick={() => { navigate(`/${page}`, { state: { subject } }); onClose(); }}
        >
          <div>
            <p className="text-2xl">{subject.name}</p>
            <p className="text-lg font-normal">{subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <MoreVertical className="text-white" />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-2 w-40 border border-white/20 shadow-2xl shadow-black/30 z-50">
            <button
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left px-4 py-2 text-blue-600 rounded-md hover:bg-gray-200/20 dark:hover:bg-gray-700/20"
            >
              Cancel
            </button>
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-200/20 dark:hover:bg-gray-700/20"
            >
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="block w-full text-left px-4 py-2 text-red-600 rounded-md hover:bg-gray-200/20 dark:hover:bg-gray-700/20"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
}

function CollectionRow({ collection, subjects, onClick, themeShadow = 'background-shadow-new' }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
    );

    return (
        <div 
            key={collection.id} 
            className={`bg-[color-mix(in_srgb,var(--theme-border-color)_80%,black_20%)] w-full h-16 mb-2 flex justify-between items-center text-white font-bold text-xl pl-2 pr-1 rounded-xl cursor-pointer ${themeShadow} background-hover`}
            onClick={onClick}>
            <div>
                <p className="text-2xl">{collection.name}</p>
                <p className="text-lg font-normal">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
            </div>
            {chev}
        </div>
    );
}

function CollectionView({ collection, subjects, onBack, onClose, page, theme, onEditSubject, onDeleteSubject }) {

    const chev = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

    )

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <BackgroundButton text={collection.name} image={chev} flip onClick={onBack} bgColor={'bg-green-500 hover:bg-green-400'}/>
                <BackgroundButton image={<X/>} bgColor={'bg-red-500 hover:bg-red-400'} onClick={onClose}/>
            </div>
            {subjects.length > 0 ? (
                subjects.map((subject) => (
                    <SubjectRow
                      key={subject.id}
                      subject={subject}
                      onClose={onClose}
                      page={page}
                      themeShadow={'background-shadow-new'}
                      onEdit={() => onEditSubject(subject)}
                      onDelete={() => onDeleteSubject(subject)}
                    />
                ))
            ) : (
                <p>No subjects in this collection.</p>
            )}
        </div>
    );
}