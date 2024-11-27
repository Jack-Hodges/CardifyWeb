import React from 'react';
import { useUser } from '../../UserContext';

const BackgroundButton = ({ text, image = null, bgColor, onClick, wWidth = "w-auto", wSizing = "w-10", hSizing = "h-10", flip = false, disabled = false}) => {
    const { theme } = useUser();

    if (image && text) {
      if (flip) {
        return (
          <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center ${wWidth} h-10 ${bgColor} text-white text-lg font-semibold rounded-full ${theme ? theme.shadowClass : 'background-shadow'} background-hover`}>
            <div className="flex items-center p-2">
              {image} {/* Show the image */}
              <span className="ml-2">{text}</span> {/* Show the text */}
            </div>
          </button>
        );
      } else {
        return (
          <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgColor} text-white text-lg font-semibold rounded-full ${theme ? theme.shadowClass : 'background-shadow'} background-hover`}>
            <div className="flex items-center p-2">
              <span className="ml-2">{text}</span> {/* Show the text */}
              {image} {/* Show the image */}
            </div>
          </button>
        );
      }
    } else if (image) {
        return (
            <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center ${wSizing} ${hSizing} ${bgColor} text-white text-lg font-semibold rounded-full ${theme ? theme.shadowClass : 'background-shadow'} background-hover`}>
                {image} {/* Show the image */}
            </button>
        );
    } else if (text) {
        return (
            <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${wWidth} ${bgColor} text-white text-lg font-semibold rounded-full ${theme ? theme.shadowClass : 'background-shadow'} background-hover`}>
                <span className="px-4">{text}</span> {/* Show the text */}
            </button>
        );
    } else {
        return (
            <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center ${wSizing} ${hSizing} ${bgColor} text-white text-lg font-semibold rounded-full ${theme ? theme.shadowClass : 'background-shadow'} background-hover`}>
                <span>➔</span> {/* Default icon */}
            </button>
        );
    }
};

export default BackgroundButton;