import { getColor } from "../Functions/getColor";
import SubjectBlock from "../Subject/SubjectBlock";

function CollectionBlock({ user, collection, subjects, isExpanded = false, onClick }) {
    const subject_count = subjects.length;

    return (
        <>
            {/* This is the closed collection box for the grid */}
            <div 
                onClick={onClick} 
                className="relative w-full h-56 cursor-pointer group background-hover bg-[#f2ebdf] dark:bg-gray-700 rounded-xl background-shadow transition duration-300"
            >
                {/* Eight squares in the background */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-2 py-6 px-5">
                    {subjects.slice(0, 8).map((subject, index) => {
                        const { bgClass } = getColor(subject.bgCol); // Destructure to get bgClass
                        return (
                            <div 
                                key={index} 
                                className={`rounded-lg ${bgClass}`} // Use only bgClass
                            ></div>
                        );
                    })}
                </div>

                {/* Blur effect behind the text */}
                <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-black/50 via-black/25 to-transparent backdrop-blur-sm rounded-bl-lg rounded-br-lg"></div>

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

            {/* This is the fixed overlay for the expanded view */}
            {isExpanded && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 p-10 bg-black bg-opacity-50"
                    onClick={onClick} // Collapse when clicking on the background
                >
                    <div 
                        className="relative w-4/5 h-4/5 bg-white rounded-lg p-4"
                        onClick={(e) => e.stopPropagation()} // Prevent click event from reaching the background when clicking inside the box
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
                            {/* Render subjects in the expanded view */}
                            {subjects.map((subject, index) => (
                                <SubjectBlock
                                    key={index}
                                    subject={subject}
                                    user={user}
                                    collection
                                />
                            ))}
                        </div>
                        {/* Close button or onClick action to collapse */}
                        <button 
                            onClick={onClick}
                            className="absolute top-4 right-4 text-white bg-red-500 rounded-full p-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default CollectionBlock;