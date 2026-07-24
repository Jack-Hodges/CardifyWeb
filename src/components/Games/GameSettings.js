import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Neo-brutalist +/- control with a typeable value field.
 */
export function SettingStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  suffix = '',
}) {
  const { theme } = useUser();
  const { textClass, secondaryColor, shadow } = theme || {};
  const atMin = value <= min;
  const atMax = value >= max;
  const [draft, setDraft] = useState(String(value));
  const labelTone = textClass || 'textColor';

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const bump = (delta) => {
    onChange(clamp(value + delta, min, max));
  };

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(Math.round(parsed), min, max);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div className="mb-4">
      <p className={`text-sm font-bold mb-2 ${labelTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
        {label}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={atMin}
          onClick={() => bump(-step)}
          className={`inline-flex items-center justify-center w-11 h-11 rounded-full shrink-0
            background-shadow-new background-hover transition-colors text-white
            ${atMin ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || 'hover:bg-purple-400'}`}`}
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>

        <div className="flex-1 h-11 flex items-center justify-center gap-1 rounded-full bg-white background-shadow-new px-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={label}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full min-w-0 bg-transparent text-center text-xl font-bold tabular-nums outline-none text-gray-800"
          />
          {suffix ? (
            <span className="text-sm font-semibold shrink-0 text-gray-500">{suffix}</span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={atMax}
          onClick={() => bump(step)}
          className={`inline-flex items-center justify-center w-11 h-11 rounded-full shrink-0
            background-shadow-new background-hover transition-colors text-white
            ${atMax ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `${secondaryColor?.bgClass || 'bg-purple-500'} ${secondaryColor?.hoverClass || 'hover:bg-purple-400'}`}`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/**
 * Neo-brutalist on/off row — label on theme bg, only the switch is coloured.
 */
export function SettingToggle({ label, checked, onChange, description }) {
  const { theme } = useUser();
  const { textClass, secondaryColor, shadow } = theme || {};
  const labelTone = textClass || 'textColor';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-full mb-3 flex items-center justify-between gap-3 py-2 text-left
        background-hover transition-all ${labelTone}`}
    >
      <span>
        <span className={`block text-sm font-bold ${shadow ? 'drop-shadow-custom' : ''}`}>
          {label}
        </span>
        {description ? (
          <span className="block text-xs mt-0.5 opacity-80">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative shrink-0 w-12 h-7 rounded-full border-2 border-[var(--theme-border-color)]
          shadow-[2px_2px_0_0_var(--theme-border-color)] transition-colors duration-200
          ${checked ? `${secondaryColor?.bgClass || 'bg-purple-500'}` : 'bg-white'}`}
      >
        <span
          className={`absolute top-1/2 left-0.5 size-5 -translate-y-1/2 rounded-full bg-white
            border-2 border-[var(--theme-border-color)] transition-transform duration-200 ease-out
            ${checked ? 'translate-x-[1.375rem] -translate-y-1/2' : 'translate-x-0 -translate-y-1/2'}`}
        />
      </span>
    </button>
  );
}

/**
 * Shared game settings — controls sit directly on the themed page background.
 */
function GameSettings({
  cardCount,
  setCardCount,
  maxCards = 50,
  timerSec,
  setTimerSec,
  shuffle,
  setShuffle,
  onStart,
  showTimer = true,
  children,
}) {
  const { theme } = useUser();
  const { textClass, primaryColor, secondaryColor, shadow } = theme || {};
  const labelTone = textClass || 'textColor';

  return (
    <div className="w-full max-w-md mx-auto mb-4 px-1 sm:px-0">
      <h3 className={`text-xl font-bold mb-5 ${labelTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
        Game settings
      </h3>

      {typeof cardCount === 'number' && setCardCount && (
        <SettingStepper
          label="Cards in session"
          value={cardCount}
          min={1}
          max={Math.max(1, maxCards)}
          onChange={setCardCount}
        />
      )}

      {showTimer && typeof timerSec === 'number' && setTimerSec && (
        <>
          <SettingStepper
            label="Timer"
            value={timerSec}
            min={10}
            max={600}
            step={10}
            suffix="sec"
            onChange={setTimerSec}
          />
          <div className="flex flex-wrap gap-2 mb-4 -mt-1">
            {[30, 60, 90, 120].map((preset) => {
              const active = timerSec === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimerSec(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold background-shadow-new background-hover
                    ${active
                      ? `${primaryColor?.bgClass || 'bg-green-500'} text-white`
                      : 'bg-white text-gray-800'}`}
                >
                  {preset}s
                </button>
              );
            })}
          </div>
        </>
      )}

      {typeof shuffle === 'boolean' && setShuffle && (
        <SettingToggle
          label="Shuffle cards"
          description="Randomize order before you start"
          checked={shuffle}
          onChange={setShuffle}
        />
      )}

      {children}

      {onStart && (
        <div className="mt-2">
          <BackgroundButton
            text="Start"
            bgColor={
              theme
                ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                : 'bg-purple-500 hover:bg-purple-400'
            }
            wWidth="w-full"
            onClick={onStart}
          />
        </div>
      )}
    </div>
  );
}

export default GameSettings;
