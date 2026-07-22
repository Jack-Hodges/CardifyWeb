import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

/**
 * Compact confirm dialog matching the profile glass panel style.
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  icon,
  confirmText = 'Confirm',
  confirmColor = 'bg-red-500 hover:bg-red-400',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useBodyScrollLock(isVisible || isClosing);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }
    // Parent closed — hide without re-triggering open
    setIsVisible(false);
    setIsClosing(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onConfirm();
    }, 300);
  };

  if (!isVisible && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-[80] p-4 sm:p-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className={`relative w-full max-w-md overflow-hidden flex flex-col
          bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl
          rounded-2xl border border-white/20 shadow-2xl shadow-black/30
          transform transition-all duration-300 ease-in-out
          ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-none px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/15">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex items-start gap-3">
              {icon && (
                <div className="shrink-0 w-11 h-11 rounded-full bg-red-500/90 flex items-center justify-center text-white">
                  {icon}
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
              </div>
            </div>
            <BackgroundButton
              image={<X size={18} strokeWidth={3} />}
              bgColor="bg-red-500 hover:bg-red-400"
              onClick={handleClose}
            />
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {typeof message === 'string' ? (
            <p className="text-base text-white/70 leading-relaxed">{message}</p>
          ) : (
            message
          )}
        </div>

        <div className="flex-none px-5 sm:px-6 py-4 border-t border-white/15 bg-black/10">
          <div className="flex sm:justify-end">
            <BackgroundButton
              text={confirmText}
              bgColor={confirmColor}
              wWidth="w-full sm:w-auto"
              onClick={handleConfirm}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
