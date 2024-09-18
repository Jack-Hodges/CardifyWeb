import { Link } from "react-router-dom";
import BackgroundButton from "../Elements/BackgroundButton";
import { useState } from "react";
import MultipleBackgroundButton from "../Elements/MultipleBackgroundButton";

function TitleBar( { text }) {

  const backArrow = (
      <svg xmlns="http://www.w3.org/2000/svg" strokeWidth="3" viewBox="0 0 24 24" fill="currentColor" className="size-10">
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
      </svg>
  );

  const [isOverlayVisible, setIsOverlayVisible] = useState(false); // State to manage overlay visibility

  // Toggle the visibility of the overlay
  const toggleOverlay = () => {
      setIsOverlayVisible(!isOverlayVisible);
  };

  // images

  const dashBoard = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
    </svg>
  )

  const create = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
    </svg>
  )

  const practice = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
    </svg>
  )

  const home = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )

  const [isExpanded, setIsExpanded] = useState(false);

  // Function to toggle the height between 10 and 40
  const toggleHeight = () => {
    setIsExpanded(!isExpanded);
  };

    return (
      <div className="relative">
        <div className="flex w-full text-left text-5xl font-bold text-gray-500 dark:text-gray-200 pl-5 items-center gap-2">

          <div
            className={`inline-flex flex-col items-center justify-center ${
              isExpanded ? 'h-44' : 'h-10'
            } px-4 bg-green-500 text-white text-lg w-40 font-semibold rounded-3xl background-shadow background-hover transition duration-300 cursor-pointer`}
            onClick={toggleHeight}
          >
            <ul>
              {!isExpanded && (
                <li>
                <p>Dashboard</p>
              </li>
              )}
              {/* Conditionally show other menu items when expanded */}
              {isExpanded && (
                <>
                  <Link to="/">
                    <div className="flex items-center justify-start hover:bg-green-400 p-1 w-32 rounded-3xl">
                      {home} {/* Show the image */}
                      <span className="ml-2">Home</span> {/* Show the text */}
                    </div>
                  </Link>
                  <Link to="/dashboard">
                    <div className="flex items-center justify-start hover:bg-green-400 p-1 w-32 rounded-3xl">
                      {dashBoard} {/* Show the image */}
                      <span className="ml-2">Dashboard</span> {/* Show the text */}
                    </div>
                  </Link>
                  <Link to="/create">
                    <div className="flex items-center justify-start hover:bg-green-400 p-1 w-32 rounded-3xl">
                      {create} {/* Show the image */}
                      <span className="ml-2">Create</span> {/* Show the text */}
                    </div>
                  </Link>
                  <Link to="/practice">
                    <div className="flex items-center justify-start hover:bg-green-400 p-1 w-32 rounded-3xl">
                      {practice} {/* Show the image */}
                      <span className="ml-2">Practice</span> {/* Show the text */}
                    </div>
                  </Link>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    )
}

export default TitleBar;