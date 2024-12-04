import { useState } from "react";
import BackgroundButton from "../Elements/BackgroundButton";
import { useUser } from "../../UserContext";

function AddBar({ text, addSub, addCol }) {
  const { theme } = useUser();
  const { secondaryColor } = theme;

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
  );

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pl-4 relative inline-block text-left z-50">
      {/* Desktop button (unchanged) */}
      <div className="hidden sm:block">
        <BackgroundButton
          text={text}
          bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'}
          wWidth="w-44"
          image={plus}
          flip
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Mobile button */}
      <div className="block sm:hidden">
        <BackgroundButton
          bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'}
          wWidth="w-44"
          image={plus}
          flip
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Dropdown options - now with precise positioning */}
      <div
        className={`
          p-1 absolute text-white text-xl font-bold 
          w-44 ${secondaryColor.bgClass} 
          ${theme ? theme.shadowClass : 'background-shadow'} 
          rounded-3xl transform transition-all duration-300 
           mt-2 sm:origin-top 
          max-sm:right-0 max-sm:top-full max-sm:origin-top-right
          ${
            isOpen 
              ? 'scale-y-100 opacity-100' 
              : 'scale-y-0 opacity-0'
          }
        `}
        style={{ 
          transformOrigin: 'top',
          zIndex: 60 // Slightly higher z-index to ensure it's on top
        }}
      >
        <LinkButton
          text="Add Subject"
          onClick={() => {
            addSub();
            setIsOpen(false);
          }}
          themeHover={theme ? secondaryColor.hoverClass : 'hover:bg-purple-400'}
        />
        <LinkButton
          text="Add Collection"
          onClick={() => {
            addCol();
            setIsOpen(false);
          }}
          themeHover={theme ? secondaryColor.hoverClass : 'hover:bg-purple-400'}
        />
      </div>
    </div>
  );
}

function LinkButton({ text, onClick, themeHover }) {
  return (
    <div 
      onClick={onClick} 
      className={`
        flex items-center justify-start 
        ${themeHover} p-1 w-full 
        rounded-3xl cursor-pointer
      `}
    >
      <span className="ml-2">{text}</span>
    </div>
  );
}

export default AddBar;