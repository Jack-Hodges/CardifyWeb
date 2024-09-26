import { Link } from "react-router-dom";
import { useState } from "react";
import BackgroundButton from "../Elements/BackgroundButton";

function TitleBar( { text }) {

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

  const [isOpen, setIsOpen] = useState(false);

  var firstImg = null;

  switch (text) {
    case "Dashboard":
      firstImg = dashBoard;
      break;
    case "Create":
      firstImg = create;
      break;
    case "Practice":
      firstImg = practice;
      break;
    default:
      firstImg = null;
      break;
  }

    return (
      <div className="pl-4 relative inline-block text-left z-50">
      {/* Use BackgroundButton as the main button */}
      <BackgroundButton
        text={text}
        bgColor="green"
        wWidth="w-44"
        image={firstImg}
        flip
        onClick={() => setIsOpen(!isOpen)}
      />

      {/* Dropdown options with animation */}
      <div
        className={`p-1 ml-4 absolute text-white text-xl font-bold left-0 mt-2 w-44 bg-green-500 background-shadow rounded-3xl transform transition-all duration-300 origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
        }`}
        style={{ transformOrigin: 'top' }} // Ensure the dropdown opens from the top
      >
        <LinkButton text="Home" img={home} />
        <LinkButton text="Dashboard" img={dashBoard} />
        <LinkButton text="Create" img={create} />
        <LinkButton text="Practice" img={practice} />
      </div>
    </div>
    )
}

export default TitleBar;

function LinkButton( { text, img } ) {

  const textLower = text.toLowerCase();

  return (
    <Link to={`/${textLower}`}>
        <div className="flex items-center justify-start hover:bg-green-400 p-1 w-full rounded-3xl">
        {img} {/* Show the image */}
        <span className="ml-2">{text}</span> {/* Show the text */}
        </div>
    </Link>
  );
}