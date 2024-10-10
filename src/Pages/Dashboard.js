import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { fetchSubjects, saveSubject, removeSubject } from '../components/Subject/SubjectManipulation'; // Import the service functions
import { useUser } from '../UserContext';
import SubjectBlock from '../components/Subject/SubjectBlock';
import Modal from '../components/Modal/Modal';
import CollectionBlock from '../components/Collections/CollectionBlock';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [editingSubject, setEditingSubject] = useState(null); // Track subject being edited
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Control DeleteModal visibility
  const [subjectToDelete, setSubjectToDelete] = useState(null); // Track subject being deleted
  const [loading, setLoading] = useState(true); // Loading state
  const [selectedSort, setSelectedSort] = useState('Most Cards'); // Track selected sort option
  const [searchTerm, setSearchTerm] = useState(''); // State to track search input
  const [selectedCollection, setSelectedCollection] = useState(null); // Track selected collection for overlay

  const navigate = useNavigate();
  const { user, loading: userLoading, getUser } = useUser(); // Get user, loading, and getUser from context

  useEffect(() => {

    // Wait until userLoading is false before performing any actions
    if (userLoading) {
      return; // Do nothing while session is still loading
    }

    // If there's no user after session is loaded, redirect to login
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch subjects if the user is available
    const loadSubjects = async () => {
      setLoading(true); // Start loading subjects
      const data = await fetchSubjects(user?.id); // Fetch subjects using the user's ID
      setSubjects(data); // Set the subjects in state
      setLoading(false); // Stop loading
    };

    loadSubjects();
  }, [user, userLoading, navigate, getUser]); // Dependency array includes user and userLoading

  // Render loading spinner while fetching the user session
  if (userLoading) {
    return <div>Loading...</div>;
  }

  const handleSaveSubject = async (id, subjectName, subjectColor) => {
    const data = await saveSubject(id, subjectName, subjectColor, user.id); // Use the saveSubject service
    if (data && !id) {
      setSubjects([...subjects, ...data]); // Append new subject(s)
    } else {
      const updatedSubjects = subjects.map(subject =>
        subject.id === id ? { ...subject, name: subjectName, bgCol: subjectColor } : subject
      );
      setSubjects(updatedSubjects); // Update the list with the edited subject
    }
    setIsModalOpen(false); // Close modal
  };

  const handleAddSubject = () => {
    setEditingSubject(null); // Reset subject being edited
    setIsModalOpen(true); // Open modal for adding
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject); // Pass the subject for editing
    setIsModalOpen(true); // Open modal for editing
  };

  const confirmDeleteSubject = (subject) => {
    setSubjectToDelete(subject); // Set the subject to delete
    setIsDeleteModalOpen(true); // Open the DeleteModal
  };

  const handleRemoveSubject = async (subjectId) => {
    const success = await removeSubject(subjectId); // Use the removeSubject service
    if (success) {
      setSubjects(subjects.filter(subject => subject.id !== subjectId)); // Update subject list
    }
    setIsDeleteModalOpen(false); // Close the delete modal
  };

  const sortedSubjects = [...subjects]
  .filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) // Filter by search term
  )
  .sort((a, b) => {
    if (selectedSort === 'Alphabetical') {
      return a.name.localeCompare(b.name); // Sort alphabetically
    } else if (selectedSort === 'Most Cards') {
      return b.flashcard_count - a.flashcard_count; // Sort by flashcard count
    } else if (selectedSort === 'Date Created') {
      return b.created_at - a.created_at; // Sort by date created
    }
    return 0;
  });

  const handleCollectionClick = (collectionId) => {
    setSelectedCollection(prev => prev === collectionId ? null : collectionId); // Toggle based on ID
  };

  const closeOverlay = () => {
    setSelectedCollection(null); // Close the overlay
  };

  const collections = [
    {
      id: 1,
      name: "Biology Collection",
      subjects: sortedSubjects, // Attach all subjects to this collection
    },
    {
      id: 2,
      name: "Collection 2",
      subjects: sortedSubjects, // Attach all subjects to this collection
    },
    {
      id: 3,
      name: "Collection 3",
      subjects: sortedSubjects, // Attach all subjects to this collection
    },
    {
      id: 4,
      name: "Collection 4",
      subjects: sortedSubjects, // Attach all subjects to this collection
    }
  ];

  return (
    <div className="w-screen h-full overflow-auto">
      <div className="flex w-full justify-between pr-5 mt-2">
        <TitleBar text="Dashboard" />
        <div className="flex gap-2">
          {/* Desktop Full Button */}
          <div className="hidden sm:block">
            <BackgroundButton 
              text="Add Subject" 
              image={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              } 
              bgColor={"purple"} 
              onClick={handleAddSubject} // Open modal to add a new subject
            />
          </div>

          <div className="block sm:hidden">
            <BackgroundButton 
              text="Add" 
              image={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              } 
              bgColor={"purple"} 
              onClick={handleAddSubject} // Open modal to add a new subject
            />
          </div>
          
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center background-shadow background-hover cursor-pointer">
            <p className="text-white font-bold text-xl">J</p>
          </div>
        </div>
        
      </div>
      <div className="flex mx-4 mt-3 items-center justify-between">
        <div className="flex gap-2">
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center w-[58%] sm:w-1/4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on input change
            className="w-full h-10 px-4 py-2 text-left rounded-full bg-gray-500 text-white background-shadow background-focus focus:outline-none"
            placeholder="Search subjects..."
          />
        </div>
      </div>
  
      {loading ? (
        // Skeleton loader while loading subjects
        <DashboardLoading />
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
          {/* Render subjects in the grid */}
          {sortedSubjects.map((subject, index) => (
            <SubjectBlock
              key={index}
              subject={subject}
              user={user}
              onEdit={() => handleEditSubject(subject)} // Pass subject to edit
              onRemoveSubject={() => confirmDeleteSubject(subject)} // Trigger confirmation modal
            />
          ))}
          {/* Render your CollectionBlock */}
          {collections.map((collection, index) => (
            <CollectionBlock
              key={collection.id}  // Use collection ID as the key
              user={user}
              collection={collection}  // Pass the collection object
              subjects={collection.subjects} // Attach the subjects specific to this collection
              onClick={() => handleCollectionClick(collection.id)} // Pass the collection ID to the onClick handler
              isExpanded={selectedCollection === collection.id} // Compare selectedCollection with collection ID
            />
          ))}
        </div>
      ) : (
        // Render "No subjects" message outside of the grid layout
        <div className="flex flex-col justify-center items-center w-full h-4/5">
          <div>
            <p className="text-gray-500 text-4xl font-bold text-center">You have no subjects</p>
            <div className="block sm:flex gap-4 mt-5 items-center justify-center">
              <BackgroundButton text="Create New Subject" bgColor={"purple"} onClick={handleAddSubject} wWidth='w-full sm:w-auto mb-3 sm:mb-0'/>
            </div>
          </div>
        </div>
      )}
  
      <AddSubject
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubject} // Pass save function
        subject={editingSubject} // Pass subject if editing, otherwise null
        text={editingSubject ? "Edit Subject" : "Add New Subject"} // Dynamic modal title
        user={user}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onFirstAction={() => setIsDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveSubject(subjectToDelete.id)}
        text="Delete Subject"
        mainText="This cannot be undone."
        firstActionText={"Cancel"}
        secondActionText={"Delete"}
      />
    </div>
  );
}

export default Dashboard;

function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
      <div className="animate-pulse bg-[#d9d6d1] h-56 w-full rounded-lg"></div>
    </div>
  );
}