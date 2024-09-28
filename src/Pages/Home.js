import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { useEffect, useState } from "react";
import { fetchSubjects } from "../components/Subject/SubjectManipulation";
import { fetchProfile } from "../components/Profile/ProfileManipulation";
import TitleBar from "../components/Navigation/TitleBar";
import SubjectBlock from "../components/Subject/SubjectBlock";
import BackgroundButton from "../components/Elements/BackgroundButton";


function Home() {

    const navigate = useNavigate();
    const { user, getUser, logout } = useUser();
    const [loading, setLoading] = useState(true); // Loading state
    const [subjects, setSubjects] = useState([]);
    const [profile, setProfile] = useState(null);

    useEffect(() => {

        // If there's no user after session is loaded, redirect to login
        if (!user) {
            getUser();
            return;
        }
    
        // Function to fetch profile and subjects
        const loadData = async () => {
            setLoading(true); // Start loading state
    
            // Fetch the user profile
            const userProfile = await fetchProfile(user.id);
            if (userProfile) {
                setProfile(userProfile); // Set the profile in state
            }
    
            // Fetch the subjects
            const subjectsData = await fetchSubjects(user.id);
            setSubjects(subjectsData); // Set the subjects in state
    
            setLoading(false); // Stop loading
        };
    
        loadData();
        
    }, [user, navigate, getUser, setProfile]);

    const logoutUser = () => {
        logout()
        navigate('/');
    }

    const goToDashboard = () => {
        navigate('/dashboard');
    }

    return (
        <div className="w-screen h-full overflow-auto">
            <div className="mt-2 mb-2">
                <TitleBar text="Home" />
            </div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-200">
                {user && profile ? (
                    <div>
                        <p className="ml-5">Hello, {profile.first_name}!</p>
                        <button onClick={logoutUser} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-full ml-5">Logout</button>

                        {/* Full-width scrollable subject div */}
                        <div>
                            <div className="flex justify-between ml-5 mr-2">
                                <p>Jump in</p>
                                <BackgroundButton text="View all and Edit" onClick={goToDashboard} bgColor={'purple'}/>
                            </div>
                            
                            <div className="flex w-full overflow-x-auto space-x-4 py-2 scrollbar-hide">
                                {subjects.map((subject, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex-shrink-0 w-1/4 ${index === 0 ? 'pl-4' : ''} ${index === subjects.length - 1 ? 'pr-4' : ''}`}
                                    >
                                        <SubjectBlock
                                            bgCol={subject.bgCol}
                                            subject={subject}
                                            user={user}
                                            home
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );

}

export default Home;