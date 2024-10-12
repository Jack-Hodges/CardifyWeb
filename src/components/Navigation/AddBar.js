import { useState } from "react";
import BackgroundButton from "../Elements/BackgroundButton";

function AddBar( { text, addSub }) {

  // images

  const plus = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="3"
        stroke="currentColor"
        className="size-6"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )

  const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="pl-4 relative inline-block text-left z-50">
      {/* Use BackgroundButton as the main button */}
      <BackgroundButton
        text={text}
        bgColor="purple"
        wWidth="w-44"
        image={plus}
        flip
        onClick={() => setIsOpen(!isOpen)}
      />

      {/* Dropdown options with animation */}
      <div
        className={`p-1 ml-4 absolute text-white text-xl font-bold left-0 mt-2 w-44 bg-purple-500 background-shadow rounded-3xl transform transition-all duration-300 origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
        }`}
        style={{ transformOrigin: 'top' }} // Ensure the dropdown opens from the top
      >
        <LinkButton
            text="Add Subject"
            onClick={() => {
                addSub();  // Call the addSub function
                setIsOpen(false);  // Set isOpen to false
            }}
        />
        <LinkButton text="Add Collection" />
      </div>
    </div>
    )
}

export default AddBar;

function LinkButton({ text, onClick }) {

  return (
    <div onClick={onClick} className="flex items-center justify-start hover:bg-purple-400 p-1 w-full rounded-3xl cursor-pointer">
      <span className="ml-2">{text}</span>
    </div>
  );
}