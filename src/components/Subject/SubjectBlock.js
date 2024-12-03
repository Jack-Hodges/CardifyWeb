import { getColor } from "../Functions/getColor";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

function SubjectBlock({ subject, onEdit, onRemoveSubject, home }) {

    const { theme } = useUser();

    const [hoveredIcon, setHoveredIcon] = useState(null); // State to track hovered icon
    const navigate = useNavigate();

    const handlePracticeClick = () => {
        navigate('/practice', { state: { subject } }); // Navigate to practice with subject and user
    };

    const handleCreateClick = () => {
        navigate('/create', { state: { subject } }); // Navigate to CreateCards with subject and user
    };

    const colors = getColor(subject.bgCol);

    return (
        <div className={`group relative mx-auto w-full h-56 ${colors.bgClass} ${colors.hoverClass} rounded-xl ${theme.shadowClass} background-hover cursor-pointer transition duration-300`}>
        <div className="absolute bottom-0 left-0 mb-1 w-full">
            <h1 className="ml-3 mr-2 text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words overflow-hidden text-ellipsis">
            {subject.name}
            </h1>
            <p className="ml-3 text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-3 break-words overflow-hidden text-ellipsis">
            {subject.flashcard_count} {subject.flashcard_count === 1 ? 'card' : 'cards'}
            </p>

            <div className={`${home ? 'flex ml-2' : 'grid grid-cols-4'} gap-4 w-full opacity-1 sm:opacity-0 justify-items-center sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300`}>

                {/* Play button */}
                <SubjectButton
                    img={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                    </svg>
                    }
                    setHoveredIcon={setHoveredIcon}
                    hoveredIcon={hoveredIcon}
                    tooltipText="Practice"
                    onClick={handlePracticeClick}
                />

                {!home && (
                    // Add Card button
                    <SubjectButton
                        img={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                        </svg>
                        }
                        setHoveredIcon={setHoveredIcon}
                        hoveredIcon={hoveredIcon}
                        tooltipText="Add"
                        onClick={handleCreateClick}
                    />
                )}
                

                {!home && (
                    // Edit button
                    <SubjectButton
                        img={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                        </svg>
                        }
                        setHoveredIcon={setHoveredIcon}
                        hoveredIcon={hoveredIcon}
                        tooltipText="Edit"
                        onClick={onEdit}
                    />
                )}
                
                {!home && (
                    // Delete button
                    <SubjectButton
                        img={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                        </svg>
                        }
                        setHoveredIcon={setHoveredIcon}
                        hoveredIcon={hoveredIcon}
                        tooltipText="Delete"
                        onClick={onRemoveSubject}
                    />
                )}
            
            </div>
        </div>
        </div>
    );
}
  
function SubjectButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {

const lowerCase = tooltipText.toLowerCase()

    return (
        <div
        className="relative text-white block items-center"
        onMouseEnter={() => setHoveredIcon(lowerCase)} // Set hovered icon based on iconType
        onMouseLeave={() => setHoveredIcon(null)} // Reset on mouse leave
        onClick={onClick} // Execute the onClick passed in
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

export default SubjectBlock;