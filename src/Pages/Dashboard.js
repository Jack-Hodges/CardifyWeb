// Dashboard.js

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { fetchSubjects, saveSubject, removeSubject } from '../components/Subject/SubjectManipulation';
import { fetchCollections } from '../components/Collections/CollectionManipulation';
import { useUser } from '../UserContext';
import SubjectBlock from '../components/Subject/SubjectBlock';
import Modal from '../components/Modal/Modal';
import CollectionBlock from '../components/Collections/CollectionBlock';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('Most Cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

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

  // Apply search and sorting to subjects
  const sortedSubjects = [...subjects]
    .filter((subject) => subject.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (selectedSort === 'Alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === 'Most Cards') {
        return b.flashcard_count - a.flashcard_count;
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
    <div className="w-screen h-full overflow-auto">
      {/* Header Section */}
      <div className="flex w-full justify-between pr-5 mt-2">
        <TitleBar text="Dashboard" />
        <div className="flex gap-2">
          {/* Add Subject Button */}
          <div className="hidden sm:block">
            <BackgroundButton
              text="Add Subject"
              image={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
              bgColor="purple"
              onClick={handleAddSubject}
            />
          </div>

          <div className="block sm:hidden">
            <BackgroundButton
              text="Add"
              image={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
              bgColor="purple"
              onClick={handleAddSubject}
            />
          </div>

          {/* User Avatar (Placeholder) */}
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center background-shadow background-hover cursor-pointer">
            <p className="text-white font-bold text-xl">{user?.name?.charAt(0) || 'U'}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex mx-4 mt-3 items-center justify-between">
        <div className="flex gap-2">
          {/* Sorting Dropdown */}
          <div className="relative group">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="border-2 border-[rgba(3,15,64,1)] rounded-full pl-2 pr-8 background-shadow background-hover bg-gray-500 text-white font-bold focus:outline-none h-10 cursor-pointer appearance-none w-full group-hover:bg-gray-600 transition-colors duration-300"
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
            className="w-full h-10 px-4 py-2 text-left rounded-full bg-gray-500 text-white background-shadow background-focus focus:outline-none"
            placeholder="Search subjects..."
          />
        </div>
      </div>

      {/* Main Content Section */}
      {loading ? (
        // Loading State
        <DashboardLoading />
      ) : subjects.length > 0 || collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
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
              onRemoveSubject={handleRemoveSubject}  // Pass the delete function as a prop
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
                bgColor="purple"
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
        subject={editingSubject}
        text={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        user={user}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onFirstAction={() => setIsDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveSubject(subjectToDelete.id)}
        text="Delete Subject"
        mainText="This will also delete all cards associated with the subject."
        firstActionText="Cancel"
        secondActionText="Delete"
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
        <div key={index} className="animate-pulse bg-gray-300 h-56 w-full rounded-lg"></div>
      ))}
    </div>
  );
}