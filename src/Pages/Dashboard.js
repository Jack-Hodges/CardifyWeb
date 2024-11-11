// Dashboard.js

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { fetchSubjects, saveSubject, removeSubject } from '../components/Subject/SubjectManipulation';
import { fetchCollections, removeCollection } from '../components/Collections/CollectionManipulation';
import { useUser } from '../UserContext';
import SubjectBlock from '../components/Subject/SubjectBlock';
import Modal from '../components/Modal/Modal';
import CollectionBlock from '../components/Collections/CollectionBlock';
import AddBar from '../components/Navigation/AddBar';
import AddCollection from '../components/Collections/AddCollection';
import { saveCollection } from '../components/Collections/CollectionManipulation';
import { getColor } from '../components/Functions/getColor';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCollectionDeleteModalOpen, setIsCollectionDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('Most Cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const navigate = useNavigate();
  const { user, loading: userLoading, theme } = useUser();
  const bgCols = getColor(theme ? theme.secondary : 'gray');

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [subjectsData, collectionsData] = await Promise.all([
        fetchSubjects(user.id),
        fetchCollections(user.id),
      ]);
      setSubjects(subjectsData);
      setCollections(collectionsData);
      setLoading(false);
    };

    loadData();
  }, [user, userLoading, navigate]);

  // Subject
  const handleSaveSubject = async (id, subjectName, subjectColor, up_to_index, collectionId) => {
    const data = await saveSubject(id, subjectName, subjectColor, user.id, up_to_index, collectionId);
    if (data && !id) {
      setSubjects([...subjects, ...data]);
    } else {
      const updatedSubjects = subjects.map((subject) =>
        subject.id === id
          ? { ...subject, name: subjectName, bgCol: subjectColor, collection_id: collectionId }
          : subject
      );
      setSubjects(updatedSubjects);
    }
    setIsModalOpen(false);
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const confirmDeleteSubject = (subject) => {
    setSubjectToDelete(subject);
    setIsDeleteModalOpen(true);
  };

  const handleRemoveSubject = async (subjectId) => {
    const success = await removeSubject(subjectId);
    if (success) {
      setSubjects(subjects.filter((subject) => subject.id !== subjectId));
    }
    setIsDeleteModalOpen(false);
  };

  // Collections
  const handleAddCollection = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleSaveCollection = async (id, userId, collectionName) => {
    const data = await saveCollection(id, userId, collectionName);
    if (data && !id) {
      // Add new collection to the collections array
      setCollections([...collections, ...data]);
    } else {
      // Update the existing collection in the collections array
      const updatedCollections = collections.map((collection) =>
        collection.id === id ? { ...collection, name: collectionName } : collection
      );
      setCollections(updatedCollections);
    }
    setIsCollectionModalOpen(false);
  };

  const confirmDeleteCollection = (collection) => {
    setCollectionToDelete(collection);
    setIsCollectionDeleteModalOpen(true);
  };

  const handleRemoveCollection = async (collectionId) => {
    const success = await removeCollection(collectionId);
    if (success) {
      setCollections(collections.filter((collection) => collection.id !== collectionId));
    }
    setIsCollectionDeleteModalOpen(false);
  };

  // Apply search and sorting to subjects
  const sortedSubjects = [...subjects]
    .filter((subject) => subject.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (selectedSort === 'Alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === 'Most Cards') {
        const cardDifference = b.flashcard_count - a.flashcard_count;
        if (cardDifference === 0) {
          return a.name.localeCompare(b.name);
        }
        return cardDifference;
      } else if (selectedSort === 'Date Created') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
  });

  // Separate subjects without a collection
  const subjectsWithoutCollection = sortedSubjects.filter((subject) => !subject.collection_id);

  // Attach subjects to their collections
  const collectionsWithSubjects = collections.map((collection) => ({
    ...collection,
    subjects: sortedSubjects.filter((subject) => subject.collection_id === collection.id),
  }));

  const handleCollectionClick = (collectionId) => {
    setSelectedCollection((prev) => (prev === collectionId ? null : collectionId));
  };

  return (
    <div className="w-screen h-full overflow-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
      {/* Header Section */}
      <TitleBar text="Dashboard" user={user}
        content={
          <div className="block">
            <AddBar text="Add" addSub={handleAddSubject} addCol={handleAddCollection}/>
          </div>
        }
      />

      {/* Controls Section */}
      <ControlSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSort={selectedSort} setSelectedSort={setSelectedSort} themeShadow={theme ? theme.shadowClass : 'background-shadow'} themeCol={bgCols ? bgCols : 'bg-gray-500 hover:bg-gray-600'} themeText={theme ? theme.textClass : 'text-white'}/>

      {/* Main Content Section */}
      {loading ? (
        // Loading State
        <DashboardLoading />
      ) : subjects.length > 0 || collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-4 gap-4">
          {/* Render Collections with Subjects */}
          {collectionsWithSubjects.map((collection) => (
            <CollectionBlock
              key={collection.id}
              user={user}
              collection={collection}
              subjects={collection.subjects}
              isExpanded={selectedCollection === collection.id}
              onClick={() => handleCollectionClick(collection.id)}
              onEditSubject={handleEditSubject}  // Pass the edit function as a prop
              onRemoveSubject={confirmDeleteSubject}  // Pass the delete function as a prop
              onEditCollection={handleEditCollection}
              onRemoveCollection={confirmDeleteCollection}
            />
          ))}

          {/* Render Subjects Not in Any Collection */}
          {subjectsWithoutCollection.map((subject) => (
            <SubjectBlock
              key={subject.id}
              subject={subject}
              user={user}
              onEdit={() => handleEditSubject(subject)}
              onRemoveSubject={() => confirmDeleteSubject(subject)}
            />
          ))}
        </div>
      ) : (
        // No Subjects or Collections Message
        <div className="flex flex-col justify-center items-center w-full h-4/5">
          <div>
            <p className="text-gray-500 text-4xl font-bold text-center">You have no subjects</p>
            <div className="block sm:flex gap-4 mt-5 items-center justify-center">
              <BackgroundButton
                text="Create New Subject"
                bgColor={theme ? theme.secondary : 'orange'}
                onClick={handleAddSubject}
                wWidth="w-full sm:w-auto mb-3 sm:mb-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      <AddSubject
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}    // Passes editingSubject to the modal
        text={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        user={user}
      />

      {/* Delete Confirmation Modal - Subject */}
      <Modal
        isOpen={isDeleteModalOpen}
        onFirstAction={() => setIsDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveSubject(subjectToDelete.id)}
        text="Delete Subject"
        mainText="This will also delete all cards associated with the subject."
        firstActionText="Cancel"
        secondActionText="Delete"
      />

      {/* Delete Confirmation Modal - Collection */}
      <Modal
        isOpen={isCollectionDeleteModalOpen}
        onFirstAction={() => setIsCollectionDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveCollection(collectionToDelete.id)}
        text="Delete Collection"
        mainText="This will NOT delete the subjects associated with the collection."
        firstActionText="Cancel"
        secondActionText="Delete"
      />

      <AddCollection 
        isOpen={isCollectionModalOpen}
        user={user}
        collection={editingCollection}
        onSave={handleSaveCollection}
        onClose={() => setIsCollectionModalOpen(false)}
        text={editingCollection ? 'Edit Collection' : 'Add New Collection'}
      />
    </div>
  );
}

export default Dashboard;

// Loading Component
function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
      {/* Loading Skeletons */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse bg-gray-300 dark:bg-gray-600 h-56 w-full rounded-lg"></div>
      ))}
    </div>
  );
}

function ControlSection( { selectedSort, setSelectedSort, searchTerm, setSearchTerm, themeShadow, themeCol, themeText = 'text-white' } ) {
  return (
    <div className="flex mx-4 mt-3 items-center justify-between">
      <div className="flex gap-2">
        {/* Sorting Dropdown */}
        <div className="relative group">
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className={`border-2 border-[rgba(3,15,64,1)] rounded-full pl-2 pr-8 ${themeShadow} background-hover ${themeCol.bgClass} ${themeCol.hoverClass} text-white font-bold focus:outline-none h-10 cursor-pointer appearance-none w-full transition-colors duration-300`}
          >
            <option value="Most Cards">Most Cards</option>
            <option value="Alphabetical">Alphabetical</option>
            <option value="Date Created">Date Created</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transition-transform duration-300 sm:group-hover:translate-x-1 sm:group-hover:translate-y-1">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {/* Search Input */}
      <div className="flex gap-2 items-center w-[58%] sm:w-1/4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full h-10 px-4 py-2 text-left rounded-full ${themeCol.bgClass} ${themeText} ${themeShadow} background-focus focus:outline-none placeholder-gray-200`}
          placeholder="Search subjects..."
        />
      </div>
    </div>
  );
}