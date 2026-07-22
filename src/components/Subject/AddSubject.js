import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';
import { fetchCollections } from '../Collections/CollectionManipulation';
import { Check, X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import ConfirmModal from '../Modals/ConfirmModal';
import { toast } from '../Toast';

const COLOR_OPTIONS = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
    'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate',
];
const COLOR_INTENSITIES = [300, 400, 500, 600, 700, 800];
const DEFAULT_INTENSITY = 500;

/** Tailwind default palette hexes for the shade scrubber gradient */
const SHADE_HEX = {
    red:     { 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b' },
    orange:  { 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412' },
    amber:   { 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e' },
    yellow:  { 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e' },
    lime:    { 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212' },
    green:   { 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534' },
    emerald: { 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46' },
    teal:    { 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59' },
    cyan:    { 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75' },
    sky:     { 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985' },
    blue:    { 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' },
    indigo:  { 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3' },
    violet:  { 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6' },
    purple:  { 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8' },
    fuchsia: { 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f' },
    pink:    { 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d' },
    rose:    { 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239' },
    slate:   { 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b' },
};

function intensityFromPointer(clientX, trackEl) {
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (COLOR_INTENSITIES.length - 1));
    return COLOR_INTENSITIES[index];
}

function ShadeScrubber({ color, intensity, onChange }) {
    const trackRef = useRef(null);
    const dragging = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const shades = SHADE_HEX[color] || SHADE_HEX.red;
    const gradient = COLOR_INTENSITIES.map((i) => shades[i]).join(', ');
    const thumbIndex = Math.max(0, COLOR_INTENSITIES.indexOf(Number(intensity)));
    const thumbPct = (thumbIndex / (COLOR_INTENSITIES.length - 1)) * 100;

    const applyFromEvent = (clientX) => {
        if (!trackRef.current) return;
        onChangeRef.current(intensityFromPointer(clientX, trackRef.current));
    };

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging.current) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            if (!trackRef.current) return;
            onChangeRef.current(intensityFromPointer(clientX, trackRef.current));
        };
        const onUp = () => { dragging.current = false; };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, []);

    return (
        <div className="mt-4 animate-[welcome-rise_0.35s_ease-out]">
            <div className="flex items-center justify-between mb-2 px-0.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Drag to shade
                </p>
                <p className="text-xs font-bold text-white/70 capitalize">
                    {color} · {intensity}
                </p>
            </div>
            <div
                ref={trackRef}
                role="slider"
                aria-label={`${color} shade`}
                aria-valuemin={300}
                aria-valuemax={800}
                aria-valuenow={intensity}
                tabIndex={0}
                className="relative h-11 rounded-full cursor-pointer background-shadow-new touch-none select-none"
                style={{ background: `linear-gradient(to right, ${gradient})` }}
                onPointerDown={(e) => {
                    dragging.current = true;
                    trackRef.current?.setPointerCapture?.(e.pointerId);
                    applyFromEvent(e.clientX);
                }}
                onClick={(e) => applyFromEvent(e.clientX)}
                onKeyDown={(e) => {
                    const idx = COLOR_INTENSITIES.indexOf(Number(intensity));
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        onChange(COLOR_INTENSITIES[Math.min(COLOR_INTENSITIES.length - 1, idx + 1)]);
                    }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        onChange(COLOR_INTENSITIES[Math.max(0, idx - 1)]);
                    }
                }}
            >
                <div className="absolute inset-y-0 left-3 right-3 flex justify-between items-center pointer-events-none">
                    {COLOR_INTENSITIES.map((i) => (
                        <span key={i} className="w-1 h-1 rounded-full bg-white/40" />
                    ))}
                </div>
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full
                        pointer-events-none transition-[left] duration-75 ease-out"
                    style={{
                        left: `calc(12px + (100% - 24px) * ${thumbPct / 100})`,
                        backgroundColor: shades[intensity] || shades[500],
                        boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,255,255,0.85)',
                    }}
                />
            </div>
            <div className="mt-2 flex justify-between px-1 text-[10px] font-semibold text-white/35">
                <span>Lighter</span>
                <span>Darker</span>
            </div>
        </div>
    );
}

function AddSubject({ isOpen, onClose, onSave, subject, text, user }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
    const [subjectName, setLocalSubjectName] = useState(subject?.name || '');
    const [subjectColor, setLocalSubjectColor] = useState(subject?.colourText ?? 'red');
    const [subjectIntensity, setSubjectIntensity] = useState(subject?.colourIntensity || DEFAULT_INTENSITY);
    const [filteredCollections, setFilteredCollections] = useState([]);
    const [collections, setCollections] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState('None');
    const [selectedCollectionId, setSelectedCollectionId] = useState(null);
    const [tuningColor, setTuningColor] = useState(null);
    const snapshotRef = useRef(null);

    useBodyScrollLock(isVisible || isClosing);

    useEffect(() => {
        if (!isOpen) {
            setIsVisible(false);
            setIsClosing(false);
            setShowUnsavedConfirm(false);
            return;
        }
        setIsVisible(true);
        setIsClosing(false);
        setShowUnsavedConfirm(false);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (!subject) {
            setLocalSubjectName('');
            setLocalSubjectColor('red');
            setSubjectIntensity(DEFAULT_INTENSITY);
            setSelectedCollection('None');
            setSelectedCollectionId(null);
            setTuningColor(null);
            snapshotRef.current = {
                name: '',
                color: 'red',
                intensity: DEFAULT_INTENSITY,
                collectionId: null,
            };
        } else {
            setLocalSubjectName(subject.name || '');
            setLocalSubjectColor(subject.colourText ?? 'red');
            setSubjectIntensity(subject.colourIntensity || DEFAULT_INTENSITY);
            setTuningColor(subject.colourText || null);
            snapshotRef.current = {
                name: subject.name || '',
                color: subject.colourText ?? 'red',
                intensity: subject.colourIntensity || DEFAULT_INTENSITY,
                collectionId: subject.collection_id ?? null,
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !subject) return;

        if (subject.collection_id) {
            const selected = collections.find((collection) => collection.id === subject.collection_id);
            if (selected) {
                setSelectedCollection(selected.name);
                setSelectedCollectionId(selected.id);
            }
        } else {
            setSelectedCollection('None');
            setSelectedCollectionId(null);
        }
    }, [isOpen, subject, collections]);

    useEffect(() => {
        const loadCollections = async () => {
            if (user?.id) {
                const userCollections = await fetchCollections(user.id);
                setCollections(userCollections);
                setFilteredCollections(userCollections);
            }
        };

        loadCollections();
    }, [user]);

    useEffect(() => {
        if (!isVisible) return;
        const onKey = (e) => {
            if (e.key === 'Escape' && !showUnsavedConfirm) requestClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isVisible, showUnsavedConfirm]); // eslint-disable-line react-hooks/exhaustive-deps

    const isDirty = () => {
        const snap = snapshotRef.current;
        if (!snap) return false;
        return (
            subjectName !== snap.name ||
            subjectColor !== snap.color ||
            subjectIntensity !== snap.intensity ||
            selectedCollectionId !== snap.collectionId
        );
    };

    const handleClose = () => {
        if (isClosing) return;
        setShowUnsavedConfirm(false);
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const requestClose = () => {
        if (isClosing) return;
        if (isDirty()) {
            setShowUnsavedConfirm(true);
            return;
        }
        handleClose();
    };

    const handleSave = () => {
        if (subjectName !== '') {
            snapshotRef.current = {
                name: subjectName,
                color: subjectColor,
                intensity: subjectIntensity,
                collectionId: selectedCollectionId,
            };
            onSave(subject?.id, subjectName, subjectColor, subjectIntensity, subject?.up_to_index, selectedCollectionId);
            handleClose();
        } else {
            toast.warning("Please add a subject name");
        }
    };

    const handleCollectionSearch = (e) => {
        const value = e.target.value;
        setSelectedCollection(value);

        if (value) {
            const filtered = collections.filter((collection) =>
                collection.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCollections(filtered);
            setShowDropdown(true);
        } else {
            setFilteredCollections(collections);
            setShowDropdown(true);
        }
    };

    const handleSelectCollection = (collection) => {
        setSelectedCollection(collection.name);
        setSelectedCollectionId(collection.id);
        setShowDropdown(false);
    };

    const handleSelectNone = () => {
        setSelectedCollection('None');
        setSelectedCollectionId(null);
        setShowDropdown(false);
    };

    const pickHue = (color) => {
        setLocalSubjectColor(color);
        if (subjectColor !== color) {
            setSubjectIntensity(DEFAULT_INTENSITY);
        }
        setTuningColor(color);
    };

    if (!isVisible && !isClosing) return null;

    const activeTuning = tuningColor || subjectColor;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300">

            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={requestClose}></div>
            <div className={`flex flex-col justify-between relative bg-gradient-to-t from-black/30 via-black/15 to-transparent backdrop-blur-xl sm:rounded-xl p-8 shadow-2xl shadow-black/30 border border-white/20 w-full h-full sm:w-3/4 sm:max-w-2xl sm:h-auto transform transition-all duration-300 ease-in-out ${isClosing ? 'animate-pop-down' : 'animate-pop-up'}`}>
                <div className="flex items-start justify-between gap-4 mb-6">
                    <h2 className="text-3xl font-bold text-white">
                        {subject ? "Edit Subject" : text}
                    </h2>
                    <BackgroundButton
                        image={<X size={20} strokeWidth={3} />}
                        bgColor="bg-red-500 hover:bg-red-400"
                        onClick={requestClose}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="subjectName" className="block text-lg font-medium mb-2 text-white/90">
                        Subject Name
                    </label>
                    <input
                        id="subjectName"
                        type="text"
                        value={subjectName}
                        onChange={(e) => setLocalSubjectName(e.target.value)}
                        className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                        placeholder="Enter the subject name here"
                        required
                    />
                </div>

                <div className="mb-6 relative">
                    <label htmlFor="collectionDropdown" className="block text-lg font-medium mb-2 text-white/90">
                        Subject Collection
                    </label>
                    <input
                        id="collectionDropdown"
                        type="text"
                        value={selectedCollection}
                        onChange={handleCollectionSearch}
                        onClick={() => setShowDropdown(true)}
                        className="bg-black/20 backdrop-blur-sm w-full p-3 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                        placeholder="Search for a collection"
                    />
                    {showDropdown && (
                        <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                            <li
                                className="cursor-pointer p-3 hover:bg-gray-600 text-gray-200"
                                onClick={handleSelectNone}
                            >
                                None
                            </li>
                            {filteredCollections.map((collection) => (
                                <li
                                    key={collection.id}
                                    className="cursor-pointer p-3 hover:bg-gray-600 text-gray-200"
                                    onClick={() => handleSelectCollection(collection)}
                                >
                                    {collection.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-lg font-medium mb-2 text-white/90">
                        Subject Color
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 sm:gap-3">
                        {COLOR_OPTIONS.map((color) => {
                            const isSelected = subjectColor === color;
                            // Selected hue shows the real shade; others stay at the family "face" (500)
                            const faceIntensity = isSelected ? subjectIntensity : DEFAULT_INTENSITY;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    aria-label={`Select ${color}`}
                                    aria-pressed={isSelected}
                                    onClick={() => pickHue(color)}
                                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-${color}-${faceIntensity}
                                        background-shadow-new background-hover flex items-center justify-center
                                        transition-all duration-200
                                        ${isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-transparent scale-105' : ''}`}
                                >
                                    {isSelected && (
                                        <Check size={18} strokeWidth={3} className="text-white drop-shadow" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {activeTuning && (
                        <ShadeScrubber
                            color={activeTuning}
                            intensity={
                                subjectColor === activeTuning
                                    ? subjectIntensity
                                    : DEFAULT_INTENSITY
                            }
                            onChange={(nextIntensity) => {
                                setLocalSubjectColor(activeTuning);
                                setSubjectIntensity(nextIntensity);
                            }}
                        />
                    )}
                </div>

                <div className="flex flex-col items-center sm:flex-row sm:justify-end sm:space-x-4">
                    <BackgroundButton text="Save" bgColor="bg-blue-500 hover:bg-blue-400" wWidth='w-full' onClick={handleSave} />
                </div>
            </div>

            <ConfirmModal
                isOpen={showUnsavedConfirm}
                onClose={() => setShowUnsavedConfirm(false)}
                onConfirm={handleClose}
                title="Unsaved changes"
                message="You have unsaved changes. Discard them?"
                confirmText="Discard"
                confirmColor="bg-red-500 hover:bg-red-400"
            />
        </div>,
        document.body
    );
}

export default AddSubject;
