import React from 'react';

const BackgroundButton = ({ text, image = null, bgColor, onClick, wWidth = "w-auto", wSizing = "w-10", hSizing = "h-10", flip = false, disabled = false, dataTour }) => {
    const disabledBgColor = "bg-gray-400"; // Define the disabled background color
    const tourProps = dataTour ? { 'data-tour': dataTour } : {};

    const buttonClass = `relative inline-flex items-center justify-center ${wWidth} h-10 ${disabled ? disabledBgColor : bgColor} text-white text-lg font-semibold rounded-full background-shadow-new background-hover`;

    if (image && text) {
        if (flip) {
            return (
                <button disabled={disabled} onClick={onClick} className={buttonClass} {...tourProps}>
                    <div className="flex items-center p-2">
                        {image} {/* Show the image */}
                        <span className="ml-2">{text}</span> {/* Show the text */}
                    </div>
                </button>
            );
        } else {
            return (
                <button disabled={disabled} onClick={onClick} className={buttonClass} {...tourProps}>
                    <div className="flex items-center p-2">
                        <span className="ml-2">{text}</span> {/* Show the text */}
                        {image} {/* Show the image */}
                    </div>
                </button>
            );
        }
    } else if (image) {
        return (
            <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center ${wSizing} ${hSizing} ${disabled ? disabledBgColor : bgColor} text-white text-lg font-semibold rounded-full background-shadow-new background-hover`} {...tourProps}>
                {image} {/* Show the image */}
            </button>
        );
    } else if (text) {
        return (
            <button disabled={disabled} onClick={onClick} className={`relative inline-flex items-center justify-center h-10 px-5 whitespace-nowrap ${wWidth} ${disabled ? disabledBgColor : bgColor} text-white text-lg font-semibold rounded-full background-shadow-new background-hover`} {...tourProps}>
                <span>{text}</span>
            </button>
        );
    }

    return null;
};

export default BackgroundButton;