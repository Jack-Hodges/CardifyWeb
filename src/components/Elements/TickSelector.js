import { Check } from 'lucide-react';
import { useUser } from '../../UserContext';

/**
 * Neo-brutalist tick box. Use anywhere a checkbox would go.
 */
function TickSelector({
  checked = false,
  onChange,
  label,
  hint,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  const { theme } = useUser();
  const { secondaryColor } = theme || {};
  const name = ariaLabel || (typeof label === 'string' ? label : 'Toggle');

  const toggle = () => {
    if (disabled || typeof onChange !== 'function') return;
    onChange(!checked);
  };

  const box = (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center size-6 rounded-md shrink-0
        border-[3px] border-[var(--theme-border-color)]
        shadow-[2px_2px_0_0_var(--theme-border-color)]
        transition-colors duration-150
        ${checked ? `${secondaryColor?.bgClass || 'bg-green-500'}` : 'bg-white'}
        ${disabled ? 'opacity-50' : ''}`}
    >
      {checked ? <Check size={14} strokeWidth={3.5} className="text-white" /> : null}
    </span>
  );

  if (label == null && hint == null) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={name}
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex items-center justify-center background-hover ${className}`}
      >
        {box}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={name}
      disabled={disabled}
      onClick={toggle}
      className={`w-full flex items-center justify-between gap-2 py-1.5 px-0.5 text-left
        background-hover ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        {box}
        {label != null ? <span className="text-sm font-semibold truncate">{label}</span> : null}
      </span>
      {hint != null ? <span className="text-xs font-semibold opacity-70 shrink-0">{hint}</span> : null}
    </button>
  );
}

export default TickSelector;
