import { useState, useEffect } from 'react';
import { useUser } from '../../UserContext';
import { fetchSubjects } from './SubjectManipulation';

function SubjectList() {
    const { user, getUser } = useUser();
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

        getUser();
        loadSubjects();
    }, [user, getUser]);

    if (loading) {
        return <div>Loading...</div>; // Show loading message while fetching data
    }

    return (
        <div>
            <h2>Subjects List</h2>
            <ul>
                {subjects.map((subject) => (
                    <li key={subject.id}>{subject.name}</li> // Display each subject name
                ))}
            </ul>
        </div>
    );
}

export default SubjectList;