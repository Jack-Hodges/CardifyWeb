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
    <div className="w-screen h-screen">

      <div className="flex w-full justify-between pr-5">
        <TitleBar text="Dashboard" />
        <BackgroundButton 
          text="Add Subject" 
          image={plusIcon} 
          bgColor={"purple"} 
          onClick={() => setIsModalOpen(true)} // Open modal on click
        />
      </div>

      <div className="grid grid-cols-4 p-4 gap-2">
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
  const navigate = useNavigate(); // Use useNavigate hook for navigation

  const handleClick = () => {
    if (activeSubject === subject.id) {
      setActiveSubject(null); // Close popup if clicking the same subject
    } else {
      setActiveSubject(subject.id); // Set the active subject to show popup
    }
  };

  const handlePracticeClick = () => {
    navigate('/practice', { state: { subject } });
  };

  const handleCreateClick = () => {
    navigate('/create', { state: { subject } });
  };

  const colors = getColor(bgCol);

  return (
    <div
      onClick={handleClick}
      className={`relative w-56 h-56 ${colors.bgClass} ${colors.hoverClass} rounded-xl background-shadow background-hover cursor-pointer`}
    >
      <div className="absolute bottom-0 left-0 ml-1 mb-1">
        <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
        <p className="text-lg text-white font-bold">{subject.flashcard_count} cards</p>
      </div>

      {/* Popup appears below when subject is clicked */}
      {activeSubject === subject.id && (
        <div className="absolute bottom-[-80px] left-0 bg-white rounded-lg shadow-lg w-full p-2 z-10">
          <button
            className="w-full py-2 mb-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handlePracticeClick}
          >
            Practice
          </button>
          <button
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={handleCreateClick}
          >
            Create
          </button>
          <button
            className="w-full py-2 mt-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={onRemoveSubject}
          >
            Remove Subject
          </button>
        </div>
      )}
    </div>
  );
}