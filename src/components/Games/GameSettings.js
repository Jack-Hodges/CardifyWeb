import { useState } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

/**
 * Shared game settings panel (card count / timer / shuffle).
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
}) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-white/80 underline underline-offset-2"
      >
        Game settings
      </button>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-white/20 bg-black/35 backdrop-blur-xl p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Game settings</h3>
        <button
          type="button"
          className="text-white/60 text-sm font-semibold"
          onClick={() => setOpen(false)}
        >
          Hide
        </button>
      </div>

      <label className="block text-sm text-white/80 font-medium mb-1">Cards in session</label>
      <input
        type="number"
        min={1}
        max={maxCards}
        value={cardCount}
        onChange={(e) => setCardCount(Math.min(maxCards, Math.max(1, Number(e.target.value) || 1)))}
        className="w-full mb-3 px-3 py-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
      />

      {showTimer && typeof timerSec === 'number' && setTimerSec && (
        <>
          <label className="block text-sm text-white/80 font-medium mb-1">Timer (seconds)</label>
          <input
            type="number"
            min={10}
            max={600}
            value={timerSec}
            onChange={(e) => setTimerSec(Math.min(600, Math.max(10, Number(e.target.value) || 60)))}
            className="w-full mb-3 px-3 py-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
          />
        </>
      )}

      {typeof shuffle === 'boolean' && setShuffle && (
        <label className="flex items-center gap-2 text-sm text-white/90 font-medium mb-4">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
            className="rounded"
          />
          Shuffle cards
        </label>
      )}

      {onStart && (
        <BackgroundButton
          text="Start"
          bgColor="bg-green-500 hover:bg-green-400"
          wWidth="w-full"
          onClick={onStart}
        />
      )}
    </div>
  );
}

export default GameSettings;
