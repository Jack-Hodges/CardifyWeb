import { Timer, Zap, Layers, Check, X, SkipForward } from 'lucide-react';
import { useUser } from '../../UserContext';

/**
 * Shared in-game HUD strip — timer / score / progress chips on the theme background.
 */
function GameHUD({ items = [], trailing }) {
  const { theme } = useUser();
  const { textClass, shadow } = theme || {};
  const tone = textClass || 'textColor';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-1">
      <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${tone}`}>
        {items.map((item) => (
          <div
            key={item.key || item.label}
            className={`flex items-center gap-1.5 ${item.className || ''}`}
            title={item.label}
          >
            {item.icon ? <span className="shrink-0 opacity-90">{item.icon}</span> : null}
            <span className={`text-lg font-semibold tabular-nums ${shadow ? 'drop-shadow-custom' : ''}`}>
              {item.value}
            </span>
            {item.hint ? (
              <span className={`text-sm font-medium opacity-75 ${shadow ? 'drop-shadow-custom' : ''}`}>
                {item.hint}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {trailing ? (
        <div className={`text-sm font-semibold ${tone} ${shadow ? 'drop-shadow-custom' : ''}`}>
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export const hudIcons = {
  timer: <Timer className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  skip: <SkipForward className="w-5 h-5" />,
};

export default GameHUD;
