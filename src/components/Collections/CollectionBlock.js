import BackgroundButton from "../Elements/BackgroundButton";
import getColors from "../Functions/getColors";
import SubjectBlock from "../Subject/SubjectBlock";
import { useState } from "react";

function CollectionBlock({ user, collection, subjects, isExpanded = false, onClick, onEditSubject, onRemoveSubject, onEditCollection, onRemoveCollection, onSaveSubject }) {

    // Memoize theme so it only recalculates if profile.theme changes

    const subject_count = subjects.length;
    const [hoveredIcon, setHoveredIcon] = useState(null);

    const cross = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );

    const edit = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
        </svg>
    );

    return (
        <>
            {/* Closed collection box for the grid */}
            <div className={`group relative mx-auto w-full h-56 cursor-pointer background-hover backdrop-blur-md rounded-xl background-shadow-new transition duration-300`}
            onClick={onClick}>
                {/* Eight squares in the background */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-2 py-6 px-5">
                    {subjects.slice(0, 8).map((subject, index) => {
                        const { bgClass } = getColors([subject.colourText, subject.colourIntensity]); // Get background color class
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

                {/* Text and Icons Section */}
                <div className="absolute bottom-0 left-0 mb-1 w-full">
                    {/* Collection name and subject count */}
                    <div className="text-left mb-[-6%] sm:mb-0">
                        <h1 className="ml-3 mr-2 text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-0 break-words overflow-hidden text-ellipsis">
                            {collection ? collection.name : 'name'}
                        </h1>
                        <p className="ml-3 text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-0 break-words overflow-hidden text-ellipsis">
                            {subject_count} {subject_count === 1 ? 'subject' : 'subjects'}
                        </p>
                    </div>

                    {/* Icons below the text */}
                    <div className="grid grid-cols-4 gap-4 w-full opacity-1 sm:opacity-0 justify-items-center sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300">

                        {/* Edit button */}
                        <div className="col-start-3">
                            <CollectionButton
                                img={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                                    </svg>
                                }
                                setHoveredIcon={setHoveredIcon}
                                hoveredIcon={hoveredIcon}
                                tooltipText="Edit"
                                onClick={() => onEditCollection(collection)}
                            />
                        </div>
                        

                        {/* Delete button */}
                        <CollectionButton
                            img={
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                </svg>
                            }
                            setHoveredIcon={setHoveredIcon}
                            hoveredIcon={hoveredIcon}
                            tooltipText="Delete"
                            onClick={() => onRemoveCollection(collection)} // Pass the function reference instead of invoking it
                        />
                    </div>
                </div>
            </div>

            {/* Expanded view overlay */}
            {isExpanded && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-10 bg-black bg-opacity-50"
                    onClick={onClick} // Collapse the overlay when clicking on the background
                >
                    <div 
                        className={`relative w-full sm:w-[95%] h-full sm:h-[90%] bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-4 pb-2 shadow-2xl shadow-black/30 border border-white/20 overflow-hidden`}
                        onClick={(e) => e.stopPropagation()} // Prevent event bubbling when clicking inside the box
                    >
                        {/* Title and close button */}
                        <div className="flex w-full justify-between px-2">
                            <p className="font-bold text-white text-4xl">{collection.name}</p>
                            <div className="flex gap-2">
                                <BackgroundButton image={edit} bgColor={'bg-blue-500 hover:bg-blue-400'} onClick={() => onEditCollection(collection)}/>
                                <BackgroundButton image={cross} bgColor={'bg-red-500 hover:bg-red-400'} onClick={onClick}/>
                            </div>
                        </div>

                        {/* Grid for subjects */}
                        <div className="flex flex-col overflow-y-auto h-[calc(100%-4rem)] sm:h-[calc(100%-4rem)] sm:grid sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 p-4 gap-4">
                            {subjects.map((subject) => (
                                <SubjectBlock
                                    key={subject.id}
                                    subject={subject}
                                    user={user}
                                    onEdit={() => onEditSubject(subject)}  // Pass the onEditSubject function here
                                    onSave={onSaveSubject}  // Pass the onSaveSubject function here
                                    onRemoveSubject={() => onRemoveSubject(subject)}  // Handle removal
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

function CollectionButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {
    const lowerCase = tooltipText.toLowerCase();

    return (
        <div
            className="relative text-white block items-center"
            onMouseEnter={() => setHoveredIcon(lowerCase)}
            onMouseLeave={() => setHoveredIcon(null)}
            onClick={(e) => {
                e.stopPropagation(); // Prevents the click from bubbling to the parent
                onClick(); // Call the button-specific onClick function
            }}
        >
            {img}
            {hoveredIcon === lowerCase && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                    {tooltipText}
                </div>
            )}
        </div>
    );
}