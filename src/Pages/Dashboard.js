import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import DeleteModal from '../components/Card/DeleteModal';
import { getColor } from '../components/Functions/getColor';
import { fetchSubjects, saveSubject, removeSubject } from '../components/Subject/SubjectManipulation'; // Import the service functions
import { useUser } from '../UserContext';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [editingSubject, setEditingSubject] = useState(null); // Track subject being edited
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Control DeleteModal visibility
  const [subjectToDelete, setSubjectToDelete] = useState(null); // Track subject being deleted
  const [loading, setLoading] = useState(true); // Loading state
  const [selectedSort, setSelectedSort] = useState('Most Cards'); // Track selected sort option
  const [searchTerm, setSearchTerm] = useState(''); // State to track search input

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
    }
    return 0;
  });

  return (
    <div className="w-screen h-full overflow-auto">
      <div className="flex w-full justify-between pr-5 mt-2">
        <TitleBar text="Dashboard" />
        <div className="flex gap-2">
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
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center background-shadow background-hover cursor-pointer">
            <p className="text-white font-bold text-xl">J</p>
          </div>
        </div>
        
      </div>
      <div className="flex mx-5 mt-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)} // Update state when dropdown value changes
            className="border-2 border-[rgba(3,15,64,1)] rounded-full p-1 background-shadow sm:background-hover bg-gray-500 text-white font-bold focus:outline-none h-10"
          >
            <option value="Most Cards">Most Cards</option>
            <option value="Alphabetical">Alphabetical</option>
          </select>
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
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
          {/* Render subjects in the grid */}
          {sortedSubjects.map((subject, index) => (
            <SubjectBlock
              key={index}
              bgCol={subject.bgCol}
              subject={subject}
              user={user}
              onEdit={() => handleEditSubject(subject)} // Pass subject to edit
              onRemoveSubject={() => confirmDeleteSubject(subject)} // Trigger confirmation modal
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
      />
  
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => handleRemoveSubject(subjectToDelete.id)} // Perform delete on confirmation
        text={`Delete Subject`}
      />
    </div>
  );
}

export default Dashboard;


// Subject Block component with play, practice, edit, and delete functionality
function SubjectBlock({ bgCol, subject, onEdit, onRemoveSubject }) {
  const [hoveredIcon, setHoveredIcon] = useState(null); // State to track hovered icon
  const navigate = useNavigate();

  const handlePracticeClick = () => {
    navigate('/practice', { state: { subject } }); // Navigate to practice with subject and user
  };

  const handleCreateClick = () => {
    navigate('/create', { state: { subject } }); // Navigate to CreateCards with subject and user
  };

  const colors = getColor(bgCol);

  return (
    <div className={`group relative w-full h-56 ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow background-hover cursor-pointer transition duration-300`}>
      <div className="absolute bottom-0 left-0 mb-1 w-full">
        <h1 className="ml-3 mr-2 text-3xl sm:text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words overflow-hidden text-ellipsis">
          {subject.name}
        </h1>
        <p className="ml-3 text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words overflow-hidden text-ellipsis">
          {subject.flashcard_count} {subject.flashcard_count === 1 ? 'card' : 'cards'}
        </p>

        <div className="grid grid-cols-4 gap-4 w-full opacity-1 sm:opacity-0 justify-items-center sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300">

          {/* Play button */}
          <SubjectButton
            img={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
              </svg>
            }
            setHoveredIcon={setHoveredIcon}
            hoveredIcon={hoveredIcon}
            tooltipText="Practice"
            onClick={handlePracticeClick}
          />

          {/* Add Card button */}
          <SubjectButton
            img={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
              </svg>
            }
            setHoveredIcon={setHoveredIcon}
            hoveredIcon={hoveredIcon}
            tooltipText="Add"
            onClick={handleCreateClick}
          />

          {/* Edit button */}
          <SubjectButton
            img={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
              </svg>
            }
            setHoveredIcon={setHoveredIcon}
            hoveredIcon={hoveredIcon}
            tooltipText="Edit"
            onClick={onEdit}
          />

          {/* Delete button */}
          <SubjectButton
            img={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
              </svg>
            }
            setHoveredIcon={setHoveredIcon}
            hoveredIcon={hoveredIcon}
            tooltipText="Delete"
            onClick={onRemoveSubject}
          />
        </div>
      </div>
    </div>
  );
}

function SubjectButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {

  const lowerCase = tooltipText.toLowerCase()

  return (
    <div
      className="relative text-white block items-center"
      onMouseEnter={() => setHoveredIcon(lowerCase)} // Set hovered icon based on iconType
      onMouseLeave={() => setHoveredIcon(null)} // Reset on mouse leave
      onClick={onClick} // Execute the onClick passed in
    >
      {img}
      {hoveredIcon === lowerCase && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
          {tooltipText}
        </div>
      )}
    </div>
  );
}