import { Link } from "react-router-dom";
import BackgroundButton from "../Elements/BackgroundButton";
import { useState } from "react";

function TitleBar( { text }) {

    const backArrow = (
        <svg xmlns="http://www.w3.org/2000/svg" stroke-width="3" viewBox="0 0 24 24" fill="currentColor" className="size-10">
          <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
    );

    const [isOverlayVisible, setIsOverlayVisible] = useState(false); // State to manage overlay visibility

    // Toggle the visibility of the overlay
    const toggleOverlay = () => {
        setIsOverlayVisible(!isOverlayVisible);
    };

    return (
        <div className="relative">
            <div className="flex w-full text-left text-5xl font-bold text-gray-500 dark:text-gray-200 pl-5 items-center gap-2 mt-3">
              <BackgroundButton image={backArrow} bgColor="green" flip/>
              {/* Practice button that toggles the overlay */}
              <BackgroundButton text={text} bgColor="green" flip onClick={toggleOverlay} />
            </div>

            {/* Conditional rendering of the absolute overlay */}
            {isOverlayVisible && (
              <div className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-3xl p-5 ml-16 mt-2 space-y-4 z-50 w-[10%] left-0 background-shadow">
                <ul className="space-y-2">
                  {/* Use <Link> for navigation */}
                  <li><Link to="/" className="text-blue-500 hover:underline">
                    <BackgroundButton text="Home" bgColor="green"/>
                  </Link></li>
                  <li><Link to="/create" className="text-blue-500 hover:underline">
                    <BackgroundButton text="Create" bgColor="green"/>
                  </Link></li>
                  <li><Link to="/practice" className="text-blue-500 hover:underline">
                    <BackgroundButton text="Practice" bgColor="green"/>
                  </Link></li>
                </ul>
              </div>
            )}
        </div>
    )
}

export default TitleBar;