import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { useEffect, useState, useMemo } from "react";
import { fetchSubjects, saveSubject } from "../components/Subject/SubjectManipulation";
import getColors from "../components/Functions/getColors";
import TitleBar from "../components/Navigation/TitleBar";
import SubjectBlock from "../components/Subject/SubjectBlock";
import BackgroundButton from "../components/Elements/BackgroundButton";
import SubjectList from "../components/Subject/SubjectList";
import SpotlightTour from "../components/Tutorial/SpotlightTour";
import usePageTour from "../components/Tutorial/usePageTour";
import { HOME_STEPS } from "../components/Tutorial/tourSteps";
import { BadgePlus, CirclePlay, NotebookText, Shuffle, BookText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const RAINBOW_JUMP_COLORS = [
  ['red', 500],
  ['orange', 500],
  ['yellow', 500],
  ['green', 500],
  ['blue', 500],
  ['purple', 500],
];

/** Default theme keeps the rainbow; other themes derive 6 shades from primary/secondary/tertiary. */
function getJumpInColors(theme) {
  if (!theme?.name || theme.name === 'default') {
    return RAINBOW_JUMP_COLORS.map((entry) => getColors(entry));
  }

  const bases = [theme.primary, theme.secondary, theme.tertiary];
  if (bases.some((entry) => !Array.isArray(entry) || entry.length !== 2)) {
    return RAINBOW_JUMP_COLORS.map((entry) => getColors(entry));
  }

  const clampIntensity = (value) => Math.min(800, Math.max(300, value));
  const recipes = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 100],
    [1, -100],
    [2, 100],
  ];

  return recipes.map(([index, delta]) => {
    const [color, intensity] = bases[index];
    return getColors([color, clampIntensity(intensity + delta)]);
  });
}

// Loading component
function HomeLoading() {
  const { theme } = useUser();
  const { textColor } = theme;
  return (
    <div className={`text-3xl font-bold ${theme ? textColor : 'text-gray-700 dark:text-gray-200'}`}>
      <div className="mx-5 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 w-2/3 bg-gray-300 rounded-md"></div>
        </div>
        <div className="h-4 w-1/4 mt-2 bg-gray-300 rounded-md"></div>
      </div>

      {/* In Progress Section */}
      <div className="mt-6">
        <div className="ml-5 mr-2 mb-3">
          <div className="h-6 w-32 bg-gray-300 rounded-md"></div>
        </div>
        <div className="flex w-full overflow-x-auto space-x-4 pb-2 px-5 scrollbar-hide">
          {Array(4).fill('').map((_, index) => (
            <div key={index} className="h-24 w-40 bg-gray-300 rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Jump In Section */}
      <div className="mt-6">
        <div className="ml-5 mr-2 mb-3">
          <div className="h-6 w-32 bg-gray-300 rounded-md"></div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-0 pb-2 sm:flex sm:space-x-4 sm:pb-2 sm:px-5 px-4 w-full overflow-x-auto scrollbar-hide">
          {Array(6).fill('').map((_, index) => (
            <div key={index} className="h-16 w-28 bg-gray-300 rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Continue Learning Section */}
      <div className="mt-6">
        <div className="flex justify-between ml-5 mr-2">
          <div className="h-6 w-40 bg-gray-300 rounded-md"></div>
          <div className="h-8 w-20 bg-gray-300 rounded-md"></div>
        </div>
        <div className="flex w-full overflow-x-auto space-x-4 py-2 scrollbar-hide">
          {Array(4).fill('').map((_, index) => (
            <div key={index} className="h-32 w-72 bg-gray-300 rounded-md flex-shrink-0 min-w-72"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { 
    user, 
    getUser, 
    profile, 
    theme, 
  } = useUser();
  
  const { primaryColor, secondaryColor, textColor, shadow } = theme;
  const jumpColors = useMemo(() => getJumpInColors(theme), [theme]);
  const [subjects, setSubjects] = useState([]);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [subjectPage, setSubjectPage] = useState('create');
  const [loading, setLoading] = useState(true);
  const pinnedSubjects = subjects.filter(subject => subject.pinned && subject.permission == null);

  const tour = usePageTour({
    key: 'home_popup',
    steps: HOME_STEPS,
    ready: !loading && Boolean(user && profile),
  });

  // Redirect unauthenticated users to root path
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch subjects whenever Home is shown (so In Progress stays fresh after Practice)
  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }

    let cancelled = false;
    const loadSubjects = async () => {
      setLoading(true);
      try {
        const subjectsData = await fetchSubjects(user, profile);
        if (!cancelled) setSubjects(subjectsData);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpenSubjectListModal = (navigateTo) => {
        setSubjectPage(navigateTo);
        setIsSubjectListModalOpen(true);
    }

    const goToDashboard = () => {
        navigate('/dashboard');
    }

    const handleSaveSubject = async (id, subjectName, subjectColor, subjectIntensity, up_to_index, collectionId, pinned) => {
      const data = await saveSubject(id, subjectName, subjectColor, subjectIntensity, user.id, up_to_index, collectionId, pinned);
      if (data && !id) {
        setSubjects([...subjects, ...data]);
      } else {
        const updatedSubjects = subjects.map((subject) =>
          subject.id === id
            ? { ...subject, name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, collection_id: collectionId, pinned: pinned }
            : subject
        );
        setSubjects(updatedSubjects);
      }
    };
  
  const Cards = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-[64px] sm:size-[100px]">
      <path d="M9.4 7.53333C9.2 7.26667 8.8 7.26667 8.6 7.53333L6.225 10.7C6.09167 10.8778 6.09167 11.1222 6.225 11.3L8.6 14.4667C8.8 14.7333 9.2 14.7333 9.4 14.4667L11.775 11.3C11.9083 11.1222 11.9083 10.8778 11.775 10.7L9.4 7.53333Z"/>
      <path d="M4.09245 5.63868C4.03647 5.5547 4.03647 5.4453 4.09245 5.36133L4.79199 4.31202C4.89094 4.16359 5.10906 4.16359 5.20801 4.31202L5.90755 5.36132C5.96353 5.4453 5.96353 5.5547 5.90755 5.63867L5.20801 6.68798C5.10906 6.83641 4.89094 6.83641 4.79199 6.68798L4.09245 5.63868Z"/>
      <path d="M13.208 15.312C13.1091 15.1636 12.8909 15.1636 12.792 15.312L12.0924 16.3613C12.0365 16.4453 12.0365 16.5547 12.0924 16.6387L12.792 17.688C12.8909 17.8364 13.1091 17.8364 13.208 17.688L13.9075 16.6387C13.9635 16.5547 13.9635 16.4453 13.9075 16.3613L13.208 15.312Z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 4C1 2.34315 2.34315 1 4 1H14C15.1323 1 16.1181 1.62732 16.6288 2.55337L20.839 3.68148C22.4394 4.11031 23.3891 5.75532 22.9603 7.35572L19.3368 20.8787C18.908 22.4791 17.263 23.4288 15.6626 23L8.19849 21H4C2.34315 21 1 19.6569 1 18V4ZM17 18V4.72339L20.3213 5.61334C20.8548 5.75628 21.1714 6.30461 21.0284 6.83808L17.405 20.361C17.262 20.8945 16.7137 21.2111 16.1802 21.0681L15.1198 20.784C16.222 20.3403 17 19.261 17 18ZM4 3C3.44772 3 3 3.44772 3 4V18C3 18.5523 3.44772 19 4 19H14C14.5523 19 15 18.5523 15 18V4C15 3.44772 14.5523 3 14 3H4Z"/>
    </svg>
  );

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{
        background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#')
          ? theme.image
          : `url(${theme.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
             <Helmet>
         <title>Home - Cardify | Your Personal Study Dashboard</title>
         <meta name="description" content="Access your personalized study dashboard with progress tracking, pinned subjects, and quick access to all your flashcard collections. Continue your learning journey with Cardify." />
         <meta name="keywords" content="study dashboard, flashcard progress, learning tracker, study organization, personalized learning" />
         <link rel="canonical" href="https://cardify.app/home" />
         <meta property="og:title" content="Home - Cardify Home" />
         <meta property="og:description" content="Your personalized study dashboard with progress tracking and quick access to all your flashcards." />
         <meta property="og:url" content="https://cardify.app/home" />
         <meta name="robots" content="noindex, nofollow" />
       </Helmet>
      {/* Fixed background - ensure it covers entire viewport */}
      <div 
        className="hidden sm:block fixed inset-0 w-screen h-[100lvh] sm:h-screen bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#') 
            ? theme.image 
            : `url(${theme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Overlay gradient */}
      <div className={`${shadow ? 'fixed top-0 left-0 w-full h-2/5 bg-gradient-to-b from-[rgba(0,0,0,0.2)] to-transparent z-5 pointer-events-none' : ''}`}></div>

      {/* Scrolling content */}
      <div className="relative z-10 min-h-[100lvh] sm:min-h-screen pb-20">
        <div>
          <TitleBar
            text="Home"
            user={user}
            home={true}
            forceMenuOpen={tour.active && tour.currentStep?.id === 'home-nav-dashboard'}
          />
        </div>

        {loading ? (
          <HomeLoading />
        ) : user && profile ? (
          <div className={`text-3xl font-bold ${theme ? textColor : 'text-gray-700 dark:text-gray-200'}`}>
            <div className="mx-5">
              <p className={`text-4xl sm:text-5xl font-bold ${shadow ? 'drop-shadow-custom' : ''}`}>
                Hey, {profile.first_name}!
                {profile.streak_current > 0 && (
                  <span className="ml-4 whitespace-nowrap" aria-label={`${profile.streak_current}-day streak`}>
                    🔥{profile.streak_current}
                  </span>
                )}
              </p>
              {profile.study_minutes_total > 0 && (
                <p className={`mt-1 text-base sm:text-lg font-semibold opacity-90 ${shadow ? 'drop-shadow-custom' : ''}`}>
                  {profile.study_minutes_total} min studied
                </p>
              )}
            </div>

            {subjects.filter(subject => subject.up_to_index != null && subject.user_id === (profile?.id || user?.id)).length > 0 && (
              <div>
                <div className={`flex justify-between ml-5 mr-2 mt-6 mb-3 ${shadow ? 'drop-shadow-custom' : ''}`}>
                  <p>In Progress</p>
                </div>
                <div className="flex w-full overflow-x-auto space-x-4 pb-2 scrollbar-hide px-5">
                  {subjects
                    .filter(subject => subject.up_to_index != null && subject.user_id === (profile?.id || user?.id))
                    .slice(0, 4)
                    .map((subject, index) => (
                      <InProgress theme={'background-shadow-new'} key={index} subject={subject} />
                    ))
                  }
                </div>
              </div>
            )}

            <div data-tour="home-jump-in">
              <div className={`flex justify-between ml-5 mr-2 mt-6 mb-3 ${shadow ? 'drop-shadow-custom' : ''}`}>
                <p>Jump In</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-0 pb-2 sm:flex sm:space-x-4 sm:pb-2 sm:px-5 px-4 w-full overflow-x-auto scrollbar-hide">
                <JumpButton text="Create" img={<BadgePlus className="size-16 sm:size-[100px]" />} color={jumpColors[0]} onClick={handleOpenSubjectListModal}/>
                <JumpButton text="Practice" img={<CirclePlay className="size-16 sm:size-[100px]" />} color={jumpColors[1]} onClick={handleOpenSubjectListModal}/>
                <JumpButton text="Memory" img={Cards} color={jumpColors[2]} onClick={handleOpenSubjectListModal}/>
                <JumpButton text="Quiz" img={<NotebookText className="size-16 sm:size-[100px]" />} color={jumpColors[3]} onClick={handleOpenSubjectListModal}/>
                <JumpButton text="Scramble" img={<Shuffle className="size-16 sm:size-[100px]" />} color={jumpColors[4]} onClick={handleOpenSubjectListModal}/>
                <JumpButton text="Type" img={<BookText className="size-16 sm:size-[100px]" />} color={jumpColors[5]} onClick={handleOpenSubjectListModal}/>
              </div>
            </div>

            {pinnedSubjects.length > 0 && (
              <div>
                <div className="flex justify-between ml-5 mr-2 mt-6">
                  <p className={`${shadow ? 'drop-shadow-custom' : ''}`}>Pinned</p>
                </div>
                <div className="flex w-full overflow-x-auto space-x-4 py-2 scrollbar-hide">
                  {pinnedSubjects.map((subject, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 min-w-72 w-1/2 sm:w-1/4 xl:w-1/5 2xl:w-1/6 ${
                        index === 0 ? 'pl-4' : ''
                      } ${index === pinnedSubjects.length - 1 ? 'pr-4' : ''}`}
                    >
                      <SubjectBlock
                        bgCol={subject.bgCol}
                        subject={subject}
                        user={user}
                        onSave={handleSaveSubject}
                        home
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subjects.length > 0 ? (<div data-tour="home-subjects">
              <div className="flex justify-between ml-5 mr-2 mt-6">
                <p className={`${shadow ? 'drop-shadow-custom' : ''}`}>Continue Learning</p>
                <BackgroundButton text="View all" onClick={goToDashboard} bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : `bg-purple-500 hover:bg-purple-400`}/>
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
                      onSave={handleSaveSubject}
                      home
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full mt-10 gap-2" data-tour="home-subjects">
              <h1 className="mb-3 text-3xl sm:text-4xl font-bold text-center px-4">Create your first subject</h1>
              <BackgroundButton text="Go to Dashboard" onClick={goToDashboard} bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : `bg-purple-500 hover:bg-purple-400`}/>
            </div>
          )}

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

      <SpotlightTour
        active={tour.active}
        step={tour.currentStep}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        isLast={tour.isLast}
        onNext={tour.next}
        onSkip={tour.skip}
      />
    </div>
  );
}

export default Home;

function JumpButton( { text, img, color, onClick }) {
  return (
    <div
      className={`group flex flex-col justify-between items-center p-2 w-full sm:w-40 h-full aspect-square sm:h-40
        ${color.bgClass} ${color.hoverClass} text-white rounded-xl background-shadow-new background-hover cursor-pointer transition duration-300`}
      onClick={() => onClick(text.toLowerCase())}
    >
      <div className="text-white [&_svg]:text-white">{img}</div>
      <p className="text-base sm:text-2xl text-white font-bold">{text}</p>
    </div>
  );
}

function InProgress({ subject, theme }) {
  const colors = getColors(subject ? [subject.colourText, subject.colourIntensity] : ['red', 500]);
  const navigate = useNavigate();
  const [cardsRemaining, setCardsRemaining] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);

  const indexToCount = subject.up_to_index + 1;

  const navigateClick = () => {
    navigate(`/practice/${subject.id}`, { state: { subject } });
  };

  const strokeWidth = 6;
  // Keep the ring near the SVG edge so right inset matches left text padding
  const radius = 47 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const calculatedRemainingCards = subject.flashcard_count - indexToCount;
    const calculatedPercentage = Math.round((indexToCount / subject.flashcard_count) * 100);
    const calculatedStrokeDashoffset = circumference - (calculatedPercentage / 100) * circumference;

    setCardsRemaining(calculatedRemainingCards);
    setPercentage(calculatedPercentage);
    setStrokeDashoffset(calculatedStrokeDashoffset);
  }, [subject, circumference, indexToCount]);

  return (
    <div
      className={`w-1/4 min-w-72 flex items-center gap-3 px-4 py-2 h-28 rounded-xl text-white ${theme} background-hover cursor-pointer ${colors.bgClass} ${colors.hoverClass}`}
      onClick={navigateClick}
    >
      <div className="min-w-0 flex-1">
        <p className="w-full truncate text-2xl">{subject.name}</p>
        <p className="text-sm">
          {cardsRemaining} {cardsRemaining === 1 ? 'card' : 'cards'} remaining
        </p>
      </div>

      <div className="relative w-20 h-20 shrink-0 flex justify-center items-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
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
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg">{percentage}%</p>
        </div>
      </div>
    </div>
  );
}