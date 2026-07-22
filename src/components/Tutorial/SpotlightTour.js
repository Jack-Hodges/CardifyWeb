import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';

const PADDING = 8;
const TIP_WIDTH = 320;

function queryVisible(selector) {
  if (!selector) return null;
  const nodes = document.querySelectorAll(selector);
  for (const el of nodes) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
      return el;
    }
  }
  return null;
}

function measureRect(selector) {
  const el = queryVisible(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
    bottom: rect.bottom + PADDING,
    right: rect.right + PADDING,
  };
}

function getTipStyle(rect, placement, viewport) {
  const gap = 12;
  const tipHeight = 180;
  const maxLeft = Math.max(12, viewport.width - TIP_WIDTH - 12);

  if (!rect || placement === 'center') {
    return {
      top: Math.max(24, viewport.height / 2 - tipHeight / 2),
      left: Math.min(maxLeft, Math.max(12, viewport.width / 2 - TIP_WIDTH / 2)),
    };
  }

  let top;
  let left = rect.left + rect.width / 2 - TIP_WIDTH / 2;

  const spaceBelow = viewport.height - rect.bottom;
  const spaceAbove = rect.top;
  let resolved = placement;

  if (placement === 'bottom' && spaceBelow < tipHeight + gap && spaceAbove > spaceBelow) {
    resolved = 'top';
  } else if (placement === 'top' && spaceAbove < tipHeight + gap && spaceBelow > spaceAbove) {
    resolved = 'bottom';
  } else if (placement === 'left' && rect.left < TIP_WIDTH + gap) {
    resolved = rect.right + TIP_WIDTH + gap < viewport.width ? 'right' : 'bottom';
  } else if (placement === 'right' && viewport.width - rect.right < TIP_WIDTH + gap) {
    resolved = rect.left > TIP_WIDTH + gap ? 'left' : 'bottom';
  }

  if (resolved === 'top') {
    top = rect.top - tipHeight - gap;
  } else if (resolved === 'bottom') {
    top = rect.bottom + gap;
  } else if (resolved === 'left') {
    top = rect.top + rect.height / 2 - tipHeight / 2;
    left = rect.left - TIP_WIDTH - gap;
  } else if (resolved === 'right') {
    top = rect.top + rect.height / 2 - tipHeight / 2;
    left = rect.right + gap;
  } else {
    top = rect.bottom + gap;
  }

  top = Math.min(Math.max(12, top), viewport.height - tipHeight - 12);
  left = Math.min(Math.max(12, left), maxLeft);

  return { top, left };
}

/**
 * @param {{
 *   active: boolean,
 *   step: import('./tourSteps').TourStep | null,
 *   stepIndex: number,
 *   totalSteps: number,
 *   isLast: boolean,
 *   onNext: () => void,
 *   onSkip: () => void,
 * }} props
 */
function SpotlightTour({ active, step, stepIndex, totalSteps, isLast, onNext, onSkip }) {
  const { theme } = useUser();
  const primaryColor = theme?.primaryColor;
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const updateMetrics = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (!step?.selector) {
      setRect(null);
      return;
    }
    const el = queryVisible(step.selector);
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
    // Measure after scroll settles
    window.requestAnimationFrame(() => {
      setRect(measureRect(step.selector));
    });
  }, [step]);

  useLayoutEffect(() => {
    if (!active || !step) return undefined;
    updateMetrics();
  }, [active, step, updateMetrics]);

  useEffect(() => {
    if (!active || !step) return undefined;

    const onResize = () => updateMetrics();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    let observer;
    if (step.selector) {
      const el = queryVisible(step.selector);
      if (el && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(updateMetrics);
        observer.observe(el);
      }
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      observer?.disconnect();
    };
  }, [active, step, updateMetrics]);

  // Escape skips; allow clicks only on tip UI, or on the highlight when advanceOn === 'target'
  useEffect(() => {
    if (!active || !step) return undefined;

    const allowTargetClick = step.advanceOn === 'target';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    const onTargetClick = () => {
      if (!allowTargetClick) return;
      const delay = typeof step.advanceDelay === 'number' ? step.advanceDelay : 0;
      window.setTimeout(() => onNext(), delay);
    };

    // Block page clicks unless this step asks for a target click (or the tip card)
    const onDocumentClick = (e) => {
      if (e.target.closest('[data-tour-tip]')) return;
      if (allowTargetClick && step.selector) {
        const matched = queryVisible(step.selector);
        if (matched && (matched === e.target || matched.contains(e.target))) {
          return;
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick, true);

    let targetEl = null;
    let previousZIndex = '';
    let previousPosition = '';
    let previousPointerEvents = '';

    if (step.selector) {
      targetEl = queryVisible(step.selector);
      if (targetEl) {
        // Clear any stuck :hover from when the overlay appeared
        previousPointerEvents = targetEl.style.pointerEvents;
        targetEl.style.pointerEvents = 'none';
        window.requestAnimationFrame(() => {
          if (!targetEl) return;
          targetEl.style.pointerEvents = previousPointerEvents;
        });

        if (allowTargetClick) {
          previousZIndex = targetEl.style.zIndex;
          previousPosition = targetEl.style.position;
          const computedPosition = window.getComputedStyle(targetEl).position;
          if (computedPosition === 'static') {
            targetEl.style.position = 'relative';
          }
          targetEl.style.zIndex = '70';
          targetEl.style.pointerEvents = 'auto';
          targetEl.addEventListener('click', onTargetClick, true);
        }
      }
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocumentClick, true);
      if (targetEl) {
        targetEl.removeEventListener('click', onTargetClick, true);
        targetEl.style.zIndex = previousZIndex;
        targetEl.style.position = previousPosition;
        targetEl.style.pointerEvents = previousPointerEvents;
      }
    };
  }, [active, step, onNext, onSkip]);

  // If a selector step loses its target, skip ahead
  useEffect(() => {
    if (!active || !step?.selector) return undefined;
    if (rect) return undefined;
    const timer = window.setTimeout(() => {
      if (!queryVisible(step.selector)) {
        onNext();
      } else {
        updateMetrics();
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [active, step, rect, onNext, updateMetrics]);

  if (!active || !step || typeof document === 'undefined') return null;

  const tipStyle = getTipStyle(rect, step.placement || 'bottom', viewport);
  const btnColor = primaryColor
    ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
    : 'bg-green-500 hover:bg-green-400';

  const targetEl = step.selector ? queryVisible(step.selector) : null;
  const targetInModal = Boolean(targetEl?.closest('[data-tour-edit-modal]'));
  const overlayZ = targetInModal ? 'z-[75]' : 'z-[60]';

  const hole = rect
    ? {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }
    : null;

  return ReactDOM.createPortal(
    <div className={`fixed inset-0 ${overlayZ} pointer-events-none`} aria-live="polite" role="dialog" aria-label="Page tutorial">
      {/* Dim layers with a rectangular hole — hole stays open so hover works */}
      {hole ? (
        <>
          <div
            className="absolute bg-black/55 pointer-events-auto"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
            aria-hidden="true"
          />
          <div
            className="absolute bg-black/55 pointer-events-auto"
            style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }}
            aria-hidden="true"
          />
          <div
            className="absolute bg-black/55 pointer-events-auto"
            style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }}
            aria-hidden="true"
          />
          <div
            className="absolute bg-black/55 pointer-events-auto"
            style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-xl ring-2 ring-white/90 shadow-[0_0_0_4px_rgba(255,255,255,0.25)] pointer-events-none transition-all duration-200"
            style={hole}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/55 pointer-events-auto" aria-hidden="true" />
      )}

      {/* Tip card */}
      <div
        data-tour-tip
        className="absolute z-[80] pointer-events-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
        style={{ top: tipStyle.top, left: tipStyle.left, width: TIP_WIDTH, maxWidth: 'calc(100vw - 24px)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-1">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h3 className="text-lg font-bold mb-1">{step.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{step.body}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1"
          >
            Skip tour
          </button>
          {step.advanceOn === 'target' ? (
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2">
              Click the highlight
            </span>
          ) : (
            <BackgroundButton
              text={isLast ? 'Done' : 'Next'}
              bgColor={btnColor}
              onClick={onNext}
              wWidth="w-auto"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SpotlightTour;
