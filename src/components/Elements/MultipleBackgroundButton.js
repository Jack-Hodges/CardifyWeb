import React from 'react';
import { getColor } from '../Functions/getColor';

const MultipleBackgroundButton = ({ buttons, bgColor, wWidth = "w-auto", hSizing = "h-10", divider = true }) => {
  // Get the background color and hover color based on the color name passed in
  const { bgClass, hoverClass } = getColor(bgColor);

  return (
    <div className={`relative inline-flex items-center justify-center ${wWidth} ${bgClass} ${hoverClass} text-white text-lg font-semibold rounded-lg shadow-md`}>
      {buttons.map((button, index) => (
        <React.Fragment key={index}>
          <button
            onClick={button.onClick}
            className={`inline-flex items-center justify-center h-full px-4 ${hSizing} ${index === 0 ? 'rounded-l-lg' : ''} ${index === buttons.length - 1 ? 'rounded-r-lg' : ''}`}
          >
            {button.image && <span className="mr-2">{button.image}</span>}
            {button.text && <span>{button.text}</span>}
          </button>
          {divider && index < buttons.length - 1 && (
            <span className="h-full w-px bg-white opacity-20" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MultipleBackgroundButton;