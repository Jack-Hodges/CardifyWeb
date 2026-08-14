import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useUser } from '../../UserContext';
import BackgroundButton from '../Elements/BackgroundButton';

export const PRACTICE_MODE_OPTIONS = [
  { id: 'classic', label: 'Classic', hint: 'One subject, in order' },
  { id: 'srs', label: 'Spaced (SM-2)', hint: 'Due cards from this subject' },
  { id: 'mixed', label: 'Mixed review', hint: 'Due cards from all your subjects' },
  { id: 'learn', label: 'Learn', hint: 'Preview, then quiz and type' },
  { id: 'true', label: 'True / False', hint: 'Spot the real answer' },
];

export function goToPracticeMode(navigate, mode, subject, extras = {}) {
  const state = { subject, ...extras };
  if (mode === 'mixed') {
    navigate('/review', { state: { mixed: true, ...extras } });
    return;
  }
  if (mode === 'learn') {
    navigate(subject?.id ? `/learn/${subject.id}` : '/learn', { state });
    return;
  }
  if (mode === 'true') {
    navigate(subject?.id ? `/true/${subject.id}` : '/true', { state });
    return;
  }
  navigate(subject?.id ? `/practice/${subject.id}` : '/practice', {
    state: { ...state, practiceMode: mode },
  });
}

function PracticeModeMenu({ current, subject, onSelect, children }) {
  const { theme } = useUser();
  const { primaryColor } = theme || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const currentLabel =
    PRACTICE_MODE_OPTIONS.find((option) => option.id === current)?.label || 'Practice';

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const choose = (mode) => {
    setOpen(false);
    if (mode === current) return;
    if (typeof onSelect === 'function') {
      onSelect(mode);
      return;
    }
    goToPracticeMode(navigate, mode, subject);
  };

  return (
    <div className="flex justify-center mt-3 px-4 relative z-40" ref={menuRef} data-tour="practice-mode">
      <div className="relative inline-block text-left">
        <BackgroundButton
          text={currentLabel}
          bgColor={
            theme
              ? `${primaryColor?.bgClass} ${primaryColor?.hoverClass}`
              : 'bg-blue-500 hover:bg-blue-400'
          }
          wWidth="w-52"
          image={<ChevronDown size={18} />}
          flip
          onClick={() => setOpen((value) => !value)}
        />
        <div
          className={`absolute left-1/2 -translate-x-1/2 mt-2 w-[min(92vw,22rem)] ${primaryColor?.bgClass || 'bg-blue-500'} background-shadow-new rounded-3xl p-2 text-white transform transition-all duration-300 origin-top ${
            open ? 'scale-y-100 opacity-100 pointer-events-auto' : 'scale-y-0 opacity-0 pointer-events-none'
          }`}
          style={{ transformOrigin: 'top' }}
        >
          {PRACTICE_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`w-full text-left font-bold text-lg px-3 py-2 rounded-2xl ${primaryColor?.hoverClass || ''} ${
                option.id === current ? 'bg-black/20' : ''
              }`}
              onClick={() => choose(option.id)}
            >
              {option.label}
            </button>
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}

export default PracticeModeMenu;
