import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { getThemeAssets } from '../Functions/getTheme';
import { saveProfile } from './ProfileManipulation';

function Modal({ isOpen, onClose, mainText, logout }) {
    const { theme, profile } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const themeAssets = getThemeAssets();

    const cross = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );

    const edit = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
        </svg>
    );

    const checkmark = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
    );

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else if (!isClosing) {
            setIsVisible(false);
        }
    }, [isOpen, isClosing]);

    const handleOnClose = (event) => {
        onClose();
        if (event) {
            event.stopPropagation();
        }
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setIsVisible(false);
        }, 300);
    }

    const handleThemeSelect = async (themeName) => {
        try {
            const themeKey = themeName.toLowerCase().replaceAll(' ', '');
            await saveProfile(
                profile.id,
                profile.first_name,
                themeKey
            );
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    };

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleOnClose}
        >
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={handleOnClose}
            ></div>

            <div
                className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-1/2 h-3/4 transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <span className={`textClass text-3xl font-semibold`}>Hey {profile.first_name}</span>
                    <div className="flex space-x-2">
                        <BackgroundButton image={edit} bgColor="bg-blue-500 hover:bg-blue-400" onClick={() => alert('Edit button clicked')} />
                        <BackgroundButton image={cross} bgColor="bg-red-500 hover:bg-red-400" onClick={handleOnClose} />
                    </div>
                </div>

                {/* Theme Assets Grid */}
                <div className="mt-4 mb-6 overflow-x-auto">
                    <div className="grid grid-rows-2 auto-cols-max grid-flow-col gap-4 min-w-min my-2">
                        {themeAssets.map((asset) => {
                            const isSelected = theme.name === asset.name.toLowerCase();
                             
                            return (
                                <div 
                                    key={asset.name}
                                    className={`${theme.shadowClass} background-hover relative w-40 p-2 rounded-lg border cursor-pointer transition-all duration-200`}
                                    onClick={() => handleThemeSelect(asset.name)}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 text-white z-10">
                                            {checkmark}
                                        </div>
                                    )}
                                    <div 
                                        className="h-24 w-full rounded-md mb-2 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${asset.url})` }}
                                    />
                                    <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                        {asset.name}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <p className="mb-6 text-lg text-gray-500 dark:text-gray-200">
                    {mainText}
                </p>

                <div>
                    <BackgroundButton text="Logout" bgColor="bg-red-500 hover:bg-red-400" onClick={logout} />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;