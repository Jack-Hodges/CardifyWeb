import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { useEffect, useState } from "react";
import { fetchSubjects } from "../components/Subject/SubjectManipulation";
import TitleBar from "../components/Navigation/TitleBar";
import SubjectBlock from "../components/Subject/SubjectBlock";
import BackgroundButton from "../components/Elements/BackgroundButton";
import { getColor } from "../components/Functions/getColor";
import SubjectList from "../components/Subject/SubjectList";

function Home() {

    const navigate = useNavigate();
    const { user, getUser, profile, theme } = useUser();
    // const [loading, setLoading] = useState(true); // Loading state
    const [subjects, setSubjects] = useState([]);
    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
    const [subjectPage, setSubjectPage] = useState('create');

    useEffect(() => {

        // If there's no user after session is loaded, redirect to login
        if (!user) {
            getUser();
            if (!user) {
                navigate('/');
            }
            return;
        }
    
        // Function to fetch profile and subjects
        const loadData = async () => {
            // setLoading(true); // Start loading state
    
            // Fetch the subjects
            const subjectsData = await fetchSubjects(user.id);
            setSubjects(subjectsData); // Set the subjects in state
    
            // setLoading(false); // Stop loading
        };
    
        loadData();
        
    }, [user, navigate, getUser]);

    const handleOpenSubjectListModal = (navigateTo) => {
        setSubjectPage(navigateTo);
        setIsSubjectListModalOpen(true);
    }

    const goToDashboard = () => {
        navigate('/dashboard');
    }

    const Plus = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-32">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
        </svg>
    );

    const Play = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-32">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
        </svg>
    );
    
    const Cards = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-32">
            <path d="M9.4 7.53333C9.2 7.26667 8.8 7.26667 8.6 7.53333L6.225 10.7C6.09167 10.8778 6.09167 11.1222 6.225 11.3L8.6 14.4667C8.8 14.7333 9.2 14.7333 9.4 14.4667L11.775 11.3C11.9083 11.1222 11.9083 10.8778 11.775 10.7L9.4 7.53333Z"/>
            <path d="M4.09245 5.63868C4.03647 5.5547 4.03647 5.4453 4.09245 5.36133L4.79199 4.31202C4.89094 4.16359 5.10906 4.16359 5.20801 4.31202L5.90755 5.36132C5.96353 5.4453 5.96353 5.5547 5.90755 5.63867L5.20801 6.68798C5.10906 6.83641 4.89094 6.83641 4.79199 6.68798L4.09245 5.63868Z"/>
            <path d="M13.208 15.312C13.1091 15.1636 12.8909 15.1636 12.792 15.312L12.0924 16.3613C12.0365 16.4453 12.0365 16.5547 12.0924 16.6387L12.792 17.688C12.8909 17.8364 13.1091 17.8364 13.208 17.688L13.9075 16.6387C13.9635 16.5547 13.9635 16.4453 13.9075 16.3613L13.208 15.312Z"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M1 4C1 2.34315 2.34315 1 4 1H14C15.1323 1 16.1181 1.62732 16.6288 2.55337L20.839 3.68148C22.4394 4.11031 23.3891 5.75532 22.9603 7.35572L19.3368 20.8787C18.908 22.4791 17.263 23.4288 15.6626 23L8.19849 21H4C2.34315 21 1 19.6569 1 18V4ZM17 18V4.72339L20.3213 5.61334C20.8548 5.75628 21.1714 6.30461 21.0284 6.83808L17.405 20.361C17.262 20.8945 16.7137 21.2111 16.1802 21.0681L15.1198 20.784C16.222 20.3403 17 19.261 17 18ZM4 3C3.44772 3 3 3.44772 3 4V18C3 18.5523 3.44772 19 4 19H14C14.5523 19 15 18.5523 15 18V4C15 3.44772 14.5523 3 14 3H4Z"/>
        </svg>
    );

    const Document = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-32">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
    );

    const Arrows = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-32">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
    );

    const Bolt = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-32">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
    );

    return (
        <div className="w-screen h-full overflow-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : 'none' }}>
            <div className="mt-2 mb-2">
                <TitleBar text="Home" user={user}/>
            </div>
            <div className={`text-3xl font-bold ${theme ? theme.textClass : 'textColor'}`}>
                {user && profile ? (
                    <div>
                        {/* Welcome top section */}
                        <div className="mx-5">
                            <div className="flex justify-between">
                                <p className="text-4xl sm:text-5xl font-bold">Welcome back, {profile.first_name}!</p>
                            </div>
                            
                            <p className="font-normal">🔥 99 days</p>
                            
                        </div>
                        
                        {subjects.filter(subject => subject.up_to_index !== null).length > 0 && (
                            <div>
                                <div className="flex justify-between ml-5 mr-2 mt-6 mb-3">
                                    <p>In Progress</p>
                                </div>

                                <div className="flex w-full overflow-x-auto space-x-4 pb-2 scrollbar-hide px-5">
                                    {subjects
                                        .filter(subject => subject.up_to_index !== null)
                                        .slice(0, 4)
                                        .map((subject, index) => (
                                            <InProgress theme={theme ? theme.shadowClass : 'background-shadow'} key={index} subject={subject} />
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex overflow-x-scroll justify-between ml-5 mr-2 mt-6 mb-3">
                                <p>Jump In</p>
                            </div>

                            {/* Learning buttons flex */}
                            <div className="flex w-full overflow-x-auto space-x-4 pb-2 scrollbar-hide px-5">
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Create" img={Plus} color="text-red-400" onClick={handleOpenSubjectListModal}/>
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Practice" img={Play} color="text-orange-400" onClick={handleOpenSubjectListModal}/>
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Memory" img={Cards} color="text-yellow-400" onClick={handleOpenSubjectListModal}/>
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Quiz" img={Document} color="text-green-400" onClick={handleOpenSubjectListModal}/>
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Scramble" img={Arrows} color="text-blue-500" onClick={handleOpenSubjectListModal}/>
                                <JumpButton theme={theme ? theme.shadowClass : 'background-shadow'} text="Dash" img={Bolt} color="text-purple-500" onClick={handleOpenSubjectListModal}/>
                            </div>
                        </div>

                        {/* Full-width scrollable subject div */}
                        <div>
                            <div className="flex justify-between ml-5 mr-2 mt-6">
                                <p>Continue Learning</p>
                                <BackgroundButton text="View all and Edit" onClick={goToDashboard} bgColor={theme ? theme.tertiary : 'purple'}/>
                            </div>
                            
                            <div className="flex w-full overflow-x-auto space-x-4 py-2 scrollbar-hide">
                                {subjects.map((subject, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex-shrink-0 min-w-72 w-1/2 sm:w-1/4 xl:w-1/5 2xl:w-1/6 ${index === 0 ? 'pl-4' : ''} ${index === subjects.length - 1 ? 'pr-4' : ''}`}
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

                        <SubjectList 
                            isOpen={isSubjectListModalOpen} 
                            onClose={() => setIsSubjectListModalOpen(false)}
                            user={user}
                            page={subjectPage}
                        />
                        
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );

}

export default Home;

function JumpButton( { text, img, color, onClick, theme }) {
    return (
        <div className={`group flex flex-col justify-between items-center p-2 w-40 h-40 bg-white dark:bg-gray-600 rounded-xl ${theme} background-hover cursor-pointer ${color}`}
            onClick={() => onClick(text.toLowerCase())}>
            {img}
            <p>{text}</p>
        </div>
    );
}

function InProgress({ subject, theme }) {
  const colors = getColor(subject ? subject.bgCol : 'red');
  const navigate = useNavigate();
  const [cardsRemaining, setCardsRemaining] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);

  const indexToCount = subject.up_to_index + 1;

  const navigateClick = () => {
    navigate('/practice', { state: { subject } });
  };

  // Circle properties
  const strokeWidth = 6;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Calculate remaining cards and percentage
    const calculatedRemainingCards = subject.flashcard_count - indexToCount;
    const calculatedPercentage = Math.round((indexToCount / subject.flashcard_count) * 100);

    // Calculate stroke offset based on percentage
    const calculatedStrokeDashoffset = circumference - (calculatedPercentage / 100) * circumference;

    // Update state
    setCardsRemaining(calculatedRemainingCards);
    setPercentage(calculatedPercentage);
    setStrokeDashoffset(calculatedStrokeDashoffset);
  }, [subject, circumference, indexToCount]);

  return (
    <div
      className={`w-1/4 min-w-72 flex items-center justify-between p-2 h-28 rounded-xl text-white ${theme} background-hover cursor-pointer ${colors.bgClass} ${colors.hoverClass}`}
      onClick={navigateClick}
    >
      <div className="w-3/4">
        <p>{subject.name}</p>
        <p className="text-sm">
          {cardsRemaining} {cardsRemaining === 1 ? 'card' : 'cards'} remaining
        </p>
      </div>

      {/* Adjusted circle and percentage text positioning */}
      <div className="w-1/4 relative flex justify-center items-center h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="white"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        {/* Centered percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg">{percentage}%</p>
        </div>
      </div>
    </div>
  );
}