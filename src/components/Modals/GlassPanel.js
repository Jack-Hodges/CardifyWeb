import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

export default function GlassPanel({ isOpen, onClose, title, subtitle, icon, children, footer, wide = false }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 300);
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
            return;
        }
        setIsVisible(false);
        setIsClosing(false);
    }, [isOpen]);

    useBodyScrollLock(isVisible || isClosing);

    useEffect(() => {
        if (!isVisible) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isVisible && !isClosing) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-[60] p-0 sm:p-6 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={handleClose} />
            <div
                className={`relative w-full ${wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'} h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col
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
                                {icon}
                                <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{title}</h2>
                            </div>
                            {subtitle && (
                                <p className="text-sm text-white/60">{subtitle}</p>
                            )}
                        </div>
                        <BackgroundButton
                            image={<X size={20} strokeWidth={3} />}
                            bgColor="bg-red-500 hover:bg-red-400"
                            onClick={handleClose}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
                    {children}
                </div>

                {footer && (
                    <div className="flex-none px-5 sm:px-7 py-4 border-t border-white/15 bg-black/10">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
