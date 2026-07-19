import ReactDOM from 'react-dom';
import BackgroundButton from "../Elements/BackgroundButton";
import getColors from "../Functions/getColors";
import SubjectBlock from "../Subject/SubjectBlock";
import { useState, useEffect } from "react";
import { X, Pencil, FolderOpen } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

function CollectionBlock({ user, collection, subjects, isExpanded = false, onClick, onEditSubject, onRemoveSubject, onEditCollection, onRemoveCollection, onSaveSubject }) {
    const subject_count = subjects.length;
    const [hoveredIcon, setHoveredIcon] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            setIsVisible(true);
            setIsClosing(false);
            return;
        }
        setIsVisible(false);
        setIsClosing(false);
    }, [isExpanded]);

    useBodyScrollLock(isVisible || isClosing);

    useEffect(() => {
        if (!isVisible) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClick?.();
        }, 300);
    };

    return (
        <>
            {/* Closed collection box for the grid */}
            <div
                className="group relative mx-auto w-full h-56 cursor-pointer background-hover backdrop-blur-md rounded-xl background-shadow-new transition duration-300"
                onClick={onClick}
            >
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-2 py-6 px-5">
                    {subjects.slice(0, 8).map((subject, index) => {
                        const { bgClass } = getColors([subject.colourText, subject.colourIntensity]);
                        return (
                            <div
                                key={index}
                                className={`rounded-lg ${bgClass}`}
                            />
                        );
                    })}
                </div>

                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 via-black/25 to-transparent backdrop-blur-sm rounded-bl-lg rounded-br-lg" />

                <div className="absolute bottom-0 left-0 mb-1 w-full">
                    <div className="text-left mb-[-6%] sm:mb-0">
                        <h1 className="ml-3 mr-2 text-3xl font-montserrat font-bold text-white transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-0 break-words overflow-hidden text-ellipsis">
                            {collection ? collection.name : 'name'}
                        </h1>
                        <p className="ml-3 text-lg text-white font-bold transform transition-transform duration-300 sm:translate-y-8 sm:group-hover:-translate-y-0 break-words overflow-hidden text-ellipsis">
                            {subject_count} {subject_count === 1 ? 'subject' : 'subjects'}
                        </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 w-full opacity-1 sm:opacity-0 justify-items-center sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition duration-300">
                        <div className="col-start-3">
                            <CollectionButton
                                img={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                                    </svg>
                                }
                                setHoveredIcon={setHoveredIcon}
                                hoveredIcon={hoveredIcon}
                                tooltipText="Edit"
                                onClick={() => onEditCollection(collection)}
                            />
                        </div>

                        <CollectionButton
                            img={
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                </svg>
                            }
                            setHoveredIcon={setHoveredIcon}
                            hoveredIcon={hoveredIcon}
                            tooltipText="Delete"
                            onClick={() => onRemoveCollection(collection)}
                        />
                    </div>
                </div>
            </div>

            {(isVisible || isClosing) && ReactDOM.createPortal(
                <div
                    className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
                    <div
                        className={`relative w-full sm:w-[95%] h-full sm:h-[90%] overflow-hidden flex flex-col
                            bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
                            sm:rounded-2xl border border-white/20 shadow-2xl shadow-black/30
                            transform transition-all duration-300 ease-in-out
                            ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex-none px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/15">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FolderOpen size={22} className="text-white/90 shrink-0" />
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                                            {collection.name}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-white/60">
                                        {subject_count} {subject_count === 1 ? 'subject' : 'subjects'}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <BackgroundButton
                                        image={<Pencil size={18} />}
                                        bgColor="bg-blue-500 hover:bg-blue-400"
                                        onClick={() => onEditCollection(collection)}
                                    />
                                    <BackgroundButton
                                        image={<X size={20} strokeWidth={3} />}
                                        bgColor="bg-red-500 hover:bg-red-400"
                                        onClick={handleClose}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
                            {subjects.length > 0 ? (
                                <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {subjects.map((subject) => (
                                        <SubjectBlock
                                            key={subject.id}
                                            subject={subject}
                                            user={user}
                                            onEdit={() => onEditSubject(subject)}
                                            onSave={onSaveSubject}
                                            onRemoveSubject={() => onRemoveSubject(subject)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="min-h-[16rem] flex flex-col items-center justify-center text-center px-4">
                                    <FolderOpen size={40} className="text-white/40 mb-3" />
                                    <p className="text-xl font-bold text-white">No subjects yet</p>
                                    <p className="text-sm text-white/60 mt-1 max-w-sm">
                                        Move subjects into this collection to see them here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default CollectionBlock;

function CollectionButton({ img, setHoveredIcon, hoveredIcon, tooltipText, onClick }) {
    const lowerCase = tooltipText.toLowerCase();

    return (
        <div
            className="relative text-white block items-center"
            onMouseEnter={() => setHoveredIcon(lowerCase)}
            onMouseLeave={() => setHoveredIcon(null)}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {img}
            {hoveredIcon === lowerCase && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white rounded-md text-sm transition-opacity duration-300 opacity-100">
                    {tooltipText}
                </div>
            )}
        </div>
    );
}
