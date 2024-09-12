import React from 'react';
import { getColor } from '../Functions/getColor';

const BackgroundButton = ({ text, image = null, bgColor, onClick, wSizing = "w-10", hSizing = "h-10", flip = false}) => {
    // Get the background color and hover color based on the color name passed in
    const { bgClass, hoverClass } = getColor(bgColor);

    if (image && text) {
      if (flip) {
        return (
          <button onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
            <div className="flex items-center p-2">
              {image} {/* Show the image */}
              <span className="ml-2">{text}</span> {/* Show the text */}
            </div>
          </button>
        );
      } else {
        return (
          <button onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
            <div className="flex items-center p-2">
              <span className="ml-2">{text}</span> {/* Show the text */}
              {image} {/* Show the image */}
            </div>
          </button>
        );
      }
    } else if (image) {
        return (
            <button onClick={onClick} className={`relative inline-flex items-center justify-center ${wSizing} ${hSizing} ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
                {image} {/* Show the image */}
            </button>
        );
    } else if (text) {
        return (
            <button onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
                <span className="px-4">{text}</span> {/* Show the text */}
            </button>
        );
    } else {
        return (
            <button onClick={onClick} className={`relative inline-flex items-center justify-center ${wSizing} ${hSizing} ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
                <span>➔</span> {/* Default icon */}
            </button>
        );
    }
};

// Function to get background and hover colors based on the color name
// const getBgAndHoverColor = (colorName) => {
//     switch (colorName) {
//         case 'blue':
//             return { bgClass: 'bg-blue-500', hoverClass: 'hover:bg-blue-400' };
//         case 'red':
//             return { bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-400' };
//         case 'yellow':
//             return { bgClass: 'bg-yellow-500', hoverClass: 'hover:bg-yellow-400' };
//         case 'green':
//             return { bgClass: 'bg-green-500', hoverClass: 'hover:bg-green-400' };
//         case 'purple':
//             return { bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-400' };
//         case 'orange':
//             return { bgClass: 'bg-orange-500', hoverClass: 'hover:bg-orange-400' };
//         default:
//             return { bgClass: 'bg-gray-500', hoverClass: 'hover:bg-gray-400' }; // Default color
//     }
// };

export default BackgroundButton;