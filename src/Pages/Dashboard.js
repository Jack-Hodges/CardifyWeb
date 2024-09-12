import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import TitleBar from '../components/Navigation/TitleBar';
import supabase from '../supabaseClient';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { getColor } from '../components/Functions/getColor';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null); // To track which subject was clicked
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [newSubjectName, setNewSubjectName] = useState(''); // State for subject name
  const [newSubjectColor, setNewSubjectColor] = useState('#000000'); // State for subject color

  // Fetch subjects from Supabase
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects') // Table name in Supabase
        .select('*');
      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }
      setSubjects(data);
    } catch (error) {
      console.error('Unexpected error fetching subjects:', error);
    }
  };

  // Add a new subject to Supabase
  const handleAddSubject = async (subjectName, subjectColor) => {
    try {
      // Insert the new subject into the 'subjects' table
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ user_id: "7e4017eb-268c-4d49-8936-077274a07c39", name: subjectName, bgCol: subjectColor, flashcard_count: 0 }])
        .select(); // Fetch the inserted rows, which include 'id' and 'created_at'
  
      if (error) {
        console.error('Error adding new subject:', error);
        return;
      }
  
      // Ensure that 'data' is an array and contains the new subject
      if (Array.isArray(data)) {
        setSubjects((prevSubjects) => [...prevSubjects, ...data]); // Append new subject to the list
      } else {
        console.error('Unexpected data format:', data); // Log any unexpected format
      }
  
      setIsModalOpen(false); // Close the modal after successfully adding the subject
    } catch (error) {
      console.error('Unexpected error adding new subject:', error);
    }
  };

  // Remove a subject from Supabase
  const handleRemoveSubject = async (subjectId) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      if (error) {
        console.error('Error deleting subject:', error);
        return;
      }
      setSubjects(subjects.filter(subject => subject.id !== subjectId)); // Update subject list
    } catch (error) {
      console.error('Unexpected error deleting subject:', error);
    }
  };

  const plusIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" className="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );

  return (
    <div className="w-screen h-[100dvh]">

      <div className="flex w-full justify-between pr-5">
        <TitleBar text="Dashboard" />
        <BackgroundButton 
          text="Add Subject" 
          image={plusIcon} 
          bgColor={"purple"} 
          onClick={() => setIsModalOpen(true)} // Open modal on click
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 p-4 gap-4">
        {subjects.map((subject, index) => (
          <SubjectBlock
            key={index}
            bgCol={subject.bgCol}
            subject={subject}
            activeSubject={activeSubject} // Pass the active subject to the block
            setActiveSubject={setActiveSubject} // Set the active subject on click
            onRemoveSubject={() => handleRemoveSubject(subject.id)} // Pass remove function
          />
        ))}
      </div>

      {/* Modal for adding a new subject */}
      <AddSubject
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddSubject} // Pass the add subject function
        subjectName={newSubjectName}
        subjectColor={newSubjectColor}
        setSubjectName={setNewSubjectName}
        setSubjectColor={setNewSubjectColor}
        text="Add New Subject"
      />
    </div>
  );
}

export default Dashboard;

// Subject Block component with remove functionality
function SubjectBlock({ bgCol, subject, activeSubject, setActiveSubject, onRemoveSubject }) {
    const [hoveredIcon, setHoveredIcon] = useState(null); // State to track hovered icon
    const navigate = useNavigate();
  
    const handleClick = () => {
      if (activeSubject === subject.id) {
        setActiveSubject(null);
      } else {
        setActiveSubject(subject.id);
      }
    };
  
    const handlePracticeClick = () => {
      navigate('/practice', { state: { subject } });
    };
  
    const handleCreateClick = () => {
      navigate('/create', { state: { subject } });
    };
  
    // Icons
    const addIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 sm:size-10">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
      </svg>
    );
  
    const playIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 sm:size-10">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
      </svg>
    );
  
    const deleteIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 sm:size-10">
        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
      </svg>
    );
  
    const editIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 sm:size-10">
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
      </svg>
    );
  
    const colors = getColor(bgCol);
  
    const getTooltipText = (icon) => {
      switch (icon) {
        case 'play':
          return 'Practice';
        case 'add':
          return 'Add';
        case 'edit':
          return 'Edit';
        case 'delete':
          return 'Delete';
        default:
          return '';
      }
    };
  
    return (
      <div
        onClick={handleClick}
        className={`group relative w-full h-56 ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow background-hover cursor-pointer transition duration-300`}
      >
        <div className="absolute bottom-0 left-0 ml-1 mb-1">
          <h1 className="text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3">
            {subject.name}
          </h1>
          <p className="text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3">
            {subject.flashcard_count} {subject.flashcard_count === 1 ? 'card' : 'cards'}
          </p>
  
          <div className="flex gap-4 opacity-1 sm:opacity-0 transform sm:translate-y-8 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300">
            <div
              className="relative text-white flex items-center"
              onMouseEnter={() => setHoveredIcon('play')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={handlePracticeClick}
            >
              {playIcon}
              {hoveredIcon === 'play' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  {getTooltipText('play')}
                </div>
              )}
            </div>
            <div
              className="relative text-white flex items-center"
              onMouseEnter={() => setHoveredIcon('add')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={handleCreateClick}
            >
              {addIcon}
              {hoveredIcon === 'add' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  {getTooltipText('add')}
                </div>
              )}
            </div>
            <div
              className="relative text-white flex items-center"
              onMouseEnter={() => setHoveredIcon('edit')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              {editIcon}
              {hoveredIcon === 'edit' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  {getTooltipText('edit')}
                </div>
              )}
            </div>
            <div
              className="relative text-white flex items-center"
              onMouseEnter={() => setHoveredIcon('delete')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={onRemoveSubject}
            >
              {deleteIcon}
              {hoveredIcon === 'delete' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                  {getTooltipText('delete')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }