import BackgroundButton from "../Elements/BackgroundButton";
import { getColor } from "../Functions/getColor";
import SubjectBlock from "../Subject/SubjectBlock";

function CollectionBlock({ user, collection, subjects, isExpanded = false, onClick, onEditSubject, onRemoveSubject }) {
    const subject_count = subjects.length;

    return (
        <>
            {/* Closed collection box for the grid */}
            <div 
                onClick={onClick} 
                className="relative w-full h-56 cursor-pointer group background-hover bg-[#f2ebdf] dark:bg-gray-700 rounded-xl background-shadow transition duration-300"
            >
                {/* Eight squares in the background */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-2 py-6 px-5">
                    {subjects.slice(0, 8).map((subject, index) => {
                        const { bgClass } = getColor(subject.bgCol); // Get background color class
                        return (
                            <div 
                                key={index} 
                                className={`rounded-lg ${bgClass}`} // Apply background color
                            ></div>
                        );
                    })}
                </div>

                {/* Blur effect behind the text */}
                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 via-black/25 to-transparent backdrop-blur-sm rounded-bl-lg rounded-br-lg"></div>

                {/* Text on top */}
                <div className="absolute bottom-0 left-0 mb-1 w-full">
                    <h1 className="ml-3 mr-2 text-3xl sm:text-3xl font-montserrat font-bold text-white">
                        {collection ? collection.name : 'name'}
                    </h1>
                    <p className="ml-3 text-lg text-white font-bold">
                        {subject_count} {subject_count === 1 ? 'subject' : 'subjects'}
                    </p>
                </div>
            </div>

            {/* Expanded view overlay */}
            {isExpanded && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 p-10 bg-black bg-opacity-50"
                    onClick={onClick} // Collapse the overlay when clicking on the background
                >
                    <div 
                        className="relative w-[95%] h-[90%] bg-white rounded-lg p-4"
                        onClick={(e) => e.stopPropagation()} // Prevent event bubbling when clicking inside the box
                    >
                        {/* Title and close button */}
                        <div className="flex w-full justify-between px-2">
                            <p className="font-bold text-gray-700 text-4xl">{collection.name}</p>
                            <BackgroundButton text="Close" bgColor={'red'} onClick={onClick}/>
                        </div>

                        {/* Grid for subjects */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
                            {subjects.map((subject, index) => (
                                <SubjectBlock
                                    key={index}
                                    subject={subject}
                                    user={user}
                                    onEdit={() => onEditSubject(subject)}  // Pass edit handler
                                    onRemoveSubject={() => onRemoveSubject(subject.id)}  // Pass delete handler
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CollectionBlock;