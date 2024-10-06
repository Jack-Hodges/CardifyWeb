import { getColor } from "../Functions/getColor";
import SubjectBlock from "../Subject/SubjectBlock";

function CollectionBlock({ user, collection, subjects, isExpanded = false, onClick }) {
    const subject_count = subjects.length;

    return (
        <div 
            onClick={onClick} // Add this click handler to trigger the expansion
            className={`${isExpanded ? 'fixed inset-0 flex items-center justify-center z-50 p-10' : 'relative w-full h-full cursor-pointer'}`}>
    
            {/* Darkened background */}
            {isExpanded && (
                <div className="absolute left-0 top-0 w-screen h-screen bg-black opacity-50"></div>
            )}
    
            <div className={`${isExpanded ? 'w-4/5 h-4/5' : 'w-full h-56 group background-hover'} relative bg-red-100 dark:bg-gray-700 rounded-xl background-shadow transition duration-300`}>
                {/* Six squares in the background */}
                {!isExpanded && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 p-5">
                        {subjects.slice(0, 6).map((subject, index) => {
                            const { bgClass } = getColor(subject.bgCol); // Destructure to get bgClass

                            return (
                                <div 
                                    key={index} 
                                    className={`rounded-lg ${bgClass}`} // Use only bgClass
                                ></div>
                            );
                        })}
                    </div>
                )}

                {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
                        {/* Render subjects in the grid */}
                        {subjects.map((subject, index) => (
                            <SubjectBlock
                                key={index}
                                subject={subject}
                                user={user}
                                collection
                            />
                        ))}
                    </div>
                )}
    
                {/* Blur effect behind the text */}
                {!isExpanded && (
                    <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-black/50 via-black/25 to-transparent backdrop-blur-sm rounded-bl-lg rounded-br-lg"></div>
                )}
    
                {/* Text on top */}
                <div className="absolute bottom-0 left-0 mb-1 w-full">
                    <h1 className="ml-3 mr-2 text-3xl sm:text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 break-words overflow-hidden text-ellipsis">
                        {collection ? collection.name : 'name'}
                    </h1>
                    <p className="ml-3 text-lg text-white font-bold transform transition-transform duration-300 break-words overflow-hidden text-ellipsis">
                        {subject_count} {subject_count === 1 ? 'subject' : 'subjects'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CollectionBlock;