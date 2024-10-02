import { useState, useEffect } from 'react';
import { fetchSubjects } from './SubjectManipulation';
import { getColor } from '../Functions/getColor';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router

function SubjectList({ isOpen, onClose, user, page = "practice" }) {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSubjects = async () => {
            if (user?.id) {
                setLoading(true); // Start loading subjects
                const data = await fetchSubjects(user.id); // Fetch subjects using the user's ID
                setSubjects(data); // Set the subjects in state
                setLoading(false); // Stop loading
            }
        };

        loadSubjects();
    }, [user]);

    if (!isOpen) {
        return null; // Don't render anything if the modal is not open
    }

    if (loading) {
        return <div>Loading...</div>; // Show loading message while fetching data
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {/* Modal Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[90%] sm:w-4/5 max-w-lg h-4/5 sm:h-[70%] overflow-y-scroll">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold mb-0 text-green-500">Subject List</h2>
                </div>

                {subjects.map((subject) => (
                    <SubjectRow subject={subject} onClose={onClose} page={page} />  
                ))}

                {/* <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="red" onClick={onClose} />
                </div> */}
            </div>
        </div>
    );
}

export default SubjectList;

function SubjectRow( { subject, onClose, page }) {
    const subjectCol = getColor(subject.bgCol);

    const navigate = useNavigate();

    const handleCreateClick = () => {
        if (page === "create") {
            navigate('/create', { state: { subject } }); // Navigate to CreateCards with subject and user
        } else {
            navigate('/practice', { state: { subject } }); // Navigate to FlashcardQuiz with subject and user
        }
        onClose();
    };

    return (
        <div 
            key={subject.id} 
            className={`${subjectCol.bgClass} ${subjectCol.hoverClass} w-full h-16 mb-2 flex justify-between items-center text-white font-bold text-xl px-2 rounded-xl cursor-pointer background-shadow background-hover`}
            onClick={handleCreateClick}>
            <p>{subject.name}</p>
            <p>{subject.flashcard_count} {subject.flashcard_count === 1 ? "card" : "cards"}</p>
        </div>
    );
}