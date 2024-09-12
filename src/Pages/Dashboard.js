import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import TitleBar from '../components/Navigation/TitleBar';
import supabase from '../supabaseClient';

function Dashboard() {

    useEffect(() => {
        fetchSubjects()
    }, []);

    const [subjects, setSubjects] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null); // To track which subject was clicked

    const fetchSubjects = async () => {
        try {
          const { data, error } = await supabase
            .from('subjects') // Table name in Supabase
            .select('*');
      
          if (error) {
            console.error('Error fetching subjects:', error);
            return [];
          }
      
          console.log('Flashcards fetched from Supabase:', data);
          setSubjects(data);
          return data;
        } catch (error) {
          console.error('Unexpected error fetching subjects:', error);
          return [];
        }
      };

    return (
      <div className="w-screen h-screen">
        <TitleBar text="Dashboard" />

        <div className="grid grid-cols-4 p-4 gap-2">
        {subjects.map((subject, index) => (
           <SubjectBlock 
             key={index} 
             bgCol={subject.bgCol} 
             subName={subject.name} 
             subjectId={subject.id}
             cardNum={3}
             activeSubject={activeSubject} // Pass the active subject to the block
             setActiveSubject={setActiveSubject} // Set the active subject on click
           />
          ))}
        </div>
      </div>
    );
}

export default Dashboard;

function SubjectBlock({ bgCol, subName, subjectId, cardNum, activeSubject, setActiveSubject }) {
    const navigate = useNavigate(); // Use useNavigate hook for navigation

    const handleClick = () => {
        if (activeSubject === subjectId) {
            setActiveSubject(null); // Close popup if clicking the same subject
        } else {
            setActiveSubject(subjectId); // Set the active subject to show popup
        }
    };

    const handlePracticeClick = () => {
        navigate('/practice', { state: { subjectId } });
    };

    const handleCreateClick = () => {
        navigate('/create', { state: { subjectId } });
    };

    return (
        <div 
            onClick={handleClick} 
            className={`relative w-56 h-56 ${bgCol} rounded-xl background-shadow background-hover cursor-pointer`}
        >
            <div className="absolute bottom-0 left-0 ml-1 mb-1">
                <h1 className="text-3xl font-bold text-white">{subName}</h1>    
                <p className="text-lg text-white font-bold">{cardNum} cards</p>
            </div>
            
            {/* Popup appears below when subject is clicked */}
            {activeSubject === subjectId && (
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
                </div>
            )}
        </div>
    );
}