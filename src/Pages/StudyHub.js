import { useUser } from '../UserContext';
import TitleBar from '../components/Navigation/TitleBar';
import { useState, useEffect } from 'react';
import { fetchPublishedSubjects } from '../components/Subject/SubjectManipulation';
import SubjectBlock from '../components/Subject/SubjectBlock';
import BackgroundButton from '../components/Elements/BackgroundButton';

export default function StudyHub() {
    const { user, theme } = useUser();
    const { shadow, textColor, secondaryColor } = theme;
    const [searchTerm, setSearchTerm] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const pageSize = 20;

    // Load initial subjects
    useEffect(() => {
        if (user) {
            loadInitialSubjects();
        }
    }, [user]);

    const loadInitialSubjects = async () => {
        setLoading(true);
        const initialSubjects = await fetchPublishedSubjects(0, '', pageSize);
        setSubjects(initialSubjects);
        setHasMore(initialSubjects.length === pageSize);
        setPage(0);
        setLoading(false);
    };

    // Load more subjects
    const loadMoreSubjects = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const nextPage = page + 1;
        const newSubjects = await fetchPublishedSubjects(nextPage, searchTerm, pageSize);
        
        if (newSubjects.length > 0) {
            setSubjects(prev => [...prev, ...newSubjects]);
            setPage(nextPage);
            setHasMore(newSubjects.length === pageSize);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    // Handle search
    const handleSearch = async () => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setIsSearching(false);
            loadInitialSubjects();
            return;
        }

        setIsSearching(true);
        setSearchLoading(true);
        const results = await fetchPublishedSubjects(0, searchTerm, pageSize);
        setSearchResults(results);
        setSearchLoading(false);
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setIsSearching(false);
        loadInitialSubjects();
    };

    return (
        <div className="w-screen h-screen relative">
            {/* Fixed background - ensure it covers entire viewport */}
            <div 
                className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
                style={{ 
                background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#') 
                    ? theme.image 
                    : `url(${theme.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
                }}
            ></div>
            
            {/* Scrolling content */}
            <div className="relative z-10 min-h-screen pb-20">
                {/* Header Section */}
                <TitleBar text="StudyHub" user={user}/>

                {/* Content div */}
                <div className={`w-full h-full flex flex-col text-left mx-5 ${theme ? textColor : 'text-gray-700 dark:text-gray-200'}`}>
                    {/* Search area */}
                    <p className={`m-auto mt-20 text-3xl font-bold ${shadow ? 'drop-shadow-custom' : ''} mb-4`}>What are you looking for?</p>
                    
                    <div className="flex items-center justify-center gap-2 w-2/3 m-auto">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className={`flex-1 h-10 px-4 py-2 text-left rounded-full ${secondaryColor.bgClass} ${textColor} background-shadow-new background-focus focus:outline-none transition-all duration-300 placeholder-gray-200`}
                            placeholder="Search subjects..."
                        />
                        <BackgroundButton
                            text="Search"
                            onClick={handleSearch}
                            disabled={searchLoading}
                            bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : `bg-purple-500 hover:bg-purple-400`}
                            wWidth="w-20"
                        />
                        {isSearching && (
                            <BackgroundButton
                                text="Clear"
                                onClick={clearSearch}
                                bgColor="bg-gray-500 hover:bg-gray-400"
                                wWidth="w-20"
                            />
                        )}
                    </div>

                    {/* Search results */}
                    {isSearching && (
                        <div className="mt-8">
                            <p className={`text-2xl font-bold ${shadow ? 'drop-shadow-custom' : ''} mb-4`}>
                                {searchLoading ? 'Searching...' : `Search results for "${searchTerm}"`}
                            </p>
                            {searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {searchResults.map((subject) => (
                                        <SubjectBlock
                                            key={subject.id}
                                            subject={subject}
                                            user={user}
                                            shared={true}
                                            onStudyHub={true}
                                        />
                                    ))}
                                </div>
                            ) : !searchLoading && (
                                <p className={`text-center text-lg font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'text-gray-700 dark:text-gray-200'} mt-10`}>
                                    No subjects found matching "{searchTerm}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* All published subjects */}
                    {!isSearching && (
                        <div className="mt-8">
                            <p className={`text-2xl font-bold ${shadow ? 'drop-shadow-custom' : ''} mb-4`}>
                                All Published Subjects
                            </p>
                            
                            {subjects.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {subjects.map((subject) => (
                                            <SubjectBlock
                                                key={subject.id}
                                                subject={subject}
                                                user={user}
                                                shared={true}
                                                onStudyHub={true}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Load More Button */}
                                    {hasMore && (
                                        <div className="flex justify-center mt-8">
                                            <BackgroundButton
                                                text={loading ? "Loading..." : "Load More"}
                                                onClick={loadMoreSubjects}
                                                disabled={loading}
                                                bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : `bg-purple-500 hover:bg-purple-400`}
                                            />
                                        </div>
                                    )}
                                    
                                    {!hasMore && subjects.length > 0 && (
                                        <p className={`text-center text-lg font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'text-gray-700 dark:text-gray-200'} mt-4`}>
                                            No more subjects to load
                                        </p>
                                    )}
                                </>
                            ) : !loading && (
                                <p className={`text-center text-lg font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'text-gray-700 dark:text-gray-200'} mt-10`}>
                                    No published subjects available
                                </p>
                            )}
                            
                            {loading && subjects.length === 0 && (
                                <p className={`text-center text-lg font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'text-gray-700 dark:text-gray-200'} mt-10`}>
                                    Loading subjects...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}