import React from 'react';

const BackgroundButton = ({ text, circular, image = null, bgColor = "bg-red-500", onClick }) => {

    if (image && text) {
        // Render both image and text
        return (
          <button onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgColor} text-white text-lg font-semibold rounded-full border-4 border-[rgba(3,15,64,1)] shadow-[3px_3px_0px_0px_rgba(3,15,64,1)] transition-all duration-300 transform hover:shadow-none hover:translate-x-1 hover:translate-y-1`}>
              <div className="flex items-center p-2">
                  <span className="ml-2">{text}</span> {/* Show the text */}
                  {image} {/* Show the image */}
              </div>
          </button>
        );
      } else if (image) {
        // Render only image (for circular button)
        return (
          <button onClick={onClick} className={`relative inline-flex items-center justify-center w-10 h-10 ${bgColor} text-white text-lg font-semibold rounded-full border-4 border-[rgba(3,15,64,1)] shadow-[3px_3px_0px_0px_rgba(3,15,64,1)] transition-all duration-300 transform hover:shadow-none hover:translate-x-1 hover:translate-y-1`}>
              {image} {/* Show the image */}
          </button>
        );
      } else if (text) {
        // Render only text
        return (
          <button onClick={onClick} className={`relative inline-flex items-center justify-center h-10 ${bgColor} text-white text-lg font-semibold rounded-full border-4 border-[rgba(3,15,64,1)] shadow-[3px_3px_0px_0px_rgba(3,15,64,1)] transition-all duration-300 transform hover:shadow-none hover:translate-x-1 hover:translate-y-1`}>
            <span class="px-4">{text}</span> {/* Default icon */}
          </button>
        );
      } else {
        // Render default circular button without image/text
        return (
            <button onClick={onClick} className={`relative inline-flex items-center justify-center w-10 h-10 ${bgColor} text-white text-lg font-semibold rounded-full border-4 border-[rgba(3,15,64,1)] shadow-[3px_3px_0px_0px_rgba(3,15,64,1)] transition-all duration-300 transform hover:shadow-none hover:translate-x-1 hover:translate-y-1`}>
              <span>➔</span> {/* Default icon */}
            </button>
          );
      }
};

export default BackgroundButton;