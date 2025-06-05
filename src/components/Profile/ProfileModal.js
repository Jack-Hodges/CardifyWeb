import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { getThemeAssets } from '../Functions/getTheme';
import { getCardArtAssets } from '../Functions/getCardArt';
import { saveProfile } from './ProfileManipulation';
import { getShares, fetchSubjects, removeShare, saveShare } from '../Subject/SubjectManipulation';
import { Cog } from 'lucide-react';
import Modal from '../Modal/Modal';

function ProfileModal({ isOpen, onClose, mainText, logout }) {
    const { theme, profile } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isSharesModalOpen, setIsSharesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [shareToDelete, setShareToDelete] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [shares, setShares] = useState([]);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isCardArtModalOpen, setIsCardArtModalOpen] = useState(false);
    const themeAssets = getThemeAssets();
    const {color, primaryColor} = theme;

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

    useEffect(() => {
        if (theme && color) {
          document.documentElement.style.setProperty('--theme-border-color', color);
        }
      }, [theme, color]);

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
        if (profile.pro) {
            try {
                const themeKey = themeName.toLowerCase().replaceAll(' ', '');
                await saveProfile(
                    profile.id,
                    profile.first_name,
                    themeKey,
                    profile.sort_preference,
                    profile.card_art
                );
                // Reload the page to apply the new theme
                window.location.reload();
            } catch (error) {
                console.error('Error updating theme:', error);
            }
        } else {
            alert('This feature is only available to Pro users.');
        }
    };

    const handleCardArtSelect = async (cardArtName) => {
        if (profile.pro) {
            try {
                const cardArtKey = cardArtName.toLowerCase();
                await saveProfile(
                    profile.id,
                    profile.first_name,
                    profile.theme,
                    profile.sort_preference,
                    cardArtKey
                );
                // Reload the page to apply the new card art
                window.location.reload();
            } catch (error) {
                console.error('Error updating card art:', error);
            }
        } else {
            alert('This feature is only available to Pro users.');
        }
    };

    const handleSharesClick = async () => {
        try {
            const sharesData = await getShares(profile.id);
            const subjectsData = await fetchSubjects(profile.id, profile.email);
            
            // Create a map of subject IDs to names
            const subjectMap = subjectsData.reduce((acc, subject) => {
                acc[subject.id] = subject.name;
                return acc;
            }, {});

            // Add subject names to the shares data
            const sharesWithNames = sharesData.map(share => ({
                ...share,
                subjectName: subjectMap[share.subject_id] || 'Unknown Subject'
            }));

            setShares(sharesWithNames);
            setIsSharesModalOpen(true);
        } catch (error) {
            console.error('Error fetching shares:', error);
        }
    };

    // Group shares by subject
    const groupedShares = shares.reduce((acc, share) => {
        const subjectName = share.subjectName;
        if (!acc[subjectName]) {
            acc[subjectName] = [];
        }
        acc[subjectName].push(share);
        return acc;
    }, {});

    const handleDeleteClick = (share) => {
        setShareToDelete(share);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (shareToDelete) {
            try {
                const success = await removeShare(shareToDelete.subject_id, shareToDelete.recipient_email);
                if (success) {
                    // Remove the deleted share from the state
                    setShares(shares.filter(share => 
                        !(share.subject_id === shareToDelete.subject_id && 
                          share.recipient_email === shareToDelete.recipient_email)
                    ));
                }
            } catch (error) {
                console.error('Error removing share:', error);
            }
        }
        setIsDeleteModalOpen(false);
        setShareToDelete(null);
    };

    const handlePermissionChange = async (share, newPermission) => {
        try {
            const success = await saveShare(share.id, share.subject_id, share.recipient_email, newPermission);
            if (success) {
                // Update the share in the state
                setShares(shares.map(s => 
                    s.id === share.id ? { ...s, permission: newPermission } : s
                ));
            }
        } catch (error) {
            console.error('Error updating permission:', error);
        }
        setActiveDropdown(null);
    };

    const sharesList = Object.entries(groupedShares).map(([subjectName, subjectShares]) => (
        <div key={subjectName} className="mb-4 p-3 bg-white/10 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">{subjectName}</h3>
            <div className="space-y-2">
                {subjectShares.map((share, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{share.recipient_email}</span>
                        <div className="flex items-center space-x-4">
                            <div className="relative permission-dropdown">
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === share.id ? null : share.id)}
                                    className="text-blue-400 hover:text-blue-300 capitalize transition-colors flex items-center"
                                >
                                    {share.permission}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                {activeDropdown === share.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePermissionChange(share, 'viewer');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                                        >
                                            Viewer
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePermissionChange(share, 'editor');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-b-lg"
                                        >
                                            Editor
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => handleDeleteClick(share)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ));

    // Add click outside handler to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.permission-dropdown')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    if (!isVisible && !isClosing) return null;

    return (
        <>
            {ReactDOM.createPortal(
                <div
                    className={`fixed p-3 sm:p-10 inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'opacity-100'
                    }`}
                    onClick={handleOnClose}
                >
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                        onClick={handleOnClose}
                    ></div>

                    <div
                        className={`relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl rounded-xl p-8 w-3/4 transform transition-all duration-300 ease-in-out border border-white/20 shadow-2xl shadow-black/30 ${
                            isClosing ? 'animate-pop-down' : 'animate-pop-up'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            {/* Header - Fixed */}
                            <div className="flex justify-between items-center mb-6">
                                <span className={`text-white text-4xl font-semibold`}>Hey {profile.first_name}</span>
                                <div className="flex space-x-2">
                                    <div className="hidden sm:block">
                                        <BackgroundButton text={profile.pro ? 'Manage Subscription' : 'Upgrade to Pro'} bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'}/>
                                    </div>
                                    <div className="block sm:hidden">
                                        <BackgroundButton image={<Cog />} bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'}/>
                                    </div>
                                    <BackgroundButton image={edit} bgColor="bg-blue-500 hover:bg-blue-400" onClick={() => alert('Edit button clicked')} />
                                    <BackgroundButton image={cross} bgColor="bg-red-500 hover:bg-red-400" onClick={handleOnClose} />
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto pr-2">
                                {/* Theme and Card Art Assets Grid */}
                                <h1 className='text-white text-2xl font-semibold'>Customisation</h1>
                                <div className='flex gap-4'>
                                    <div className="mt-4 mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-lg">Theme</span>
                                        </div>
                                        <div className="flex justify-center">
                                            <div 
                                                className="background-shadow-new background-hover bg-white dark:bg-gray-800 relative w-40 p-2 rounded-lg border cursor-pointer transition-all duration-200"
                                                onClick={() => setIsThemeModalOpen(true)}
                                            >
                                                <div 
                                                    className="h-24 w-full rounded-md mb-2 bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${themeAssets.find(asset => asset.name.toLowerCase() === theme.name)?.url})` }}
                                                />
                                                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                                    {themeAssets.find(asset => asset.name.toLowerCase() === theme.name)?.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Art Grid */}
                                    <div className="mt-4 mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-lg">Card Art</span>
                                        </div>
                                        <div className="flex justify-center">
                                            <div 
                                                className="background-shadow-new background-hover bg-white dark:bg-gray-800 relative w-40 p-2 rounded-lg border cursor-pointer transition-all duration-200"
                                                onClick={() => setIsCardArtModalOpen(true)}
                                            >
                                                <div 
                                                    className="h-24 w-full rounded-md mb-2 bg-cover bg-center"
                                                    style={{ backgroundImage: getCardArtAssets().find(asset => asset.name.toLowerCase() === profile.card_art)?.url ? `url(${getCardArtAssets().find(asset => asset.name.toLowerCase() === profile.card_art)?.url})` : 'none' }}
                                                />
                                                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                                    {getCardArtAssets().find(asset => asset.name.toLowerCase() === profile.card_art)?.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                

                                {/* Card Count Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white text-2xl font-semibold">Card Count</span>
                                        <span className="text-white text-sm">{profile.flashcard_count || 0}/{profile.pro ? '500' : '100'}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                                            style={{ width: `${Math.min((profile.flashcard_count || 0) / (profile.pro ? 500 : 100) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <p className="mb-6 text-lg text-gray-500 dark:text-gray-200">
                                    {mainText}
                                </p>
                            </div>

                            {/* Logout and card share buttons */}
                            <div className="flex gap-2">
                                <BackgroundButton 
                                    text="View Subject Shares" 
                                    bgColor="bg-purple-500 hover:bg-purple-400" 
                                    onClick={handleSharesClick}
                                />
                                <BackgroundButton 
                                    text="Logout" 
                                    bgColor="bg-red-500 hover:bg-red-400" 
                                    onClick={logout} 
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            <Modal
                isOpen={isSharesModalOpen}
                onFirstAction={() => setIsSharesModalOpen(false)}
                text="Subject Shares"
                mainText={
                    <div className="max-h-[60vh] overflow-y-auto">
                        {sharesList.length > 0 ? sharesList : (
                            <p className="text-gray-400">No subjects are currently shared.</p>
                        )}
                    </div>
                }
                firstActionText="Close"
                firstActionCol="bg-gray-500 hover:bg-gray-400"
                secondActionText=""
                secondActionCol=""
                width="w-1/3"
            />
            <Modal
                isOpen={isDeleteModalOpen}
                onFirstAction={() => setIsDeleteModalOpen(false)}
                onSecondAction={handleConfirmDelete}
                text="Confirm Remove"
                mainText={`Are you sure you want to remove access for ${shareToDelete?.recipient_email}?`}
                firstActionText="Cancel"
                firstActionCol="bg-gray-500 hover:bg-gray-400"
                secondActionText="Remove"
                secondActionCol="bg-red-500 hover:bg-red-400"
            />
            <Modal
                isOpen={isThemeModalOpen}
                onFirstAction={() => setIsThemeModalOpen(false)}
                text="Select Theme"
                mainText={
                    <div className="grid grid-rows-3 grid-cols-5 gap-4 overflow-y-auto max-h-[60vh]">
                        {themeAssets.map((asset) => (
                            <div 
                                key={asset.name}
                                className="background-shadow-new background-hover bg-white dark:bg-gray-800 relative w-40 p-2 rounded-lg border cursor-pointer transition-all duration-200"
                                onClick={() => {
                                    handleThemeSelect(asset.name);
                                    setIsThemeModalOpen(false);
                                }}
                            >
                                <div 
                                    className="h-24 w-full rounded-md mb-2 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${asset.url})` }}
                                />
                                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                    {asset.name}
                                </p>
                            </div>
                        ))}
                    </div>
                }
                width="w-1/2"
                firstActionText="Close"
                firstActionCol="bg-gray-500 hover:bg-gray-400"
                secondActionText=""
                secondActionCol=""
            />
            <Modal
                isOpen={isCardArtModalOpen}
                onFirstAction={() => setIsCardArtModalOpen(false)}
                text="Select Card Art"
                mainText={
                    <div className="grid grid-rows-3 grid-cols-5 gap-4 overflow-y-auto max-h-[60vh]">
                        {getCardArtAssets().map((asset) => (
                            <div 
                                key={asset.name}
                                className="background-shadow-new background-hover bg-white dark:bg-gray-800 relative w-40 p-2 rounded-lg border cursor-pointer transition-all duration-200"
                                onClick={() => {
                                    handleCardArtSelect(asset.name);
                                    setIsCardArtModalOpen(false);
                                }}
                            >
                                <div 
                                    className="h-24 w-full rounded-md mb-2 bg-cover bg-center"
                                    style={{ backgroundImage: asset.url ? `url(${asset.url})` : 'none' }}
                                />
                                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                    {asset.name}
                                </p>
                            </div>
                        ))}
                    </div>
                }
                width="w-1/2"
                firstActionText="Close"
                firstActionCol="bg-gray-500 hover:bg-gray-400"
                secondActionText=""
                secondActionCol=""
            />
        </>
    );
}

export default ProfileModal;