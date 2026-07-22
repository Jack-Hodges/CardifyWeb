import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../UserContext';

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

/**
 * Resolves which tour steps currently have a DOM target (or need none).
 * @param {import('./tourSteps').TourStep[]} steps
 */
export function getAvailableSteps(steps) {
  return steps.filter((step) => {
    if (!step.selector) return true;
    return Boolean(queryVisible(step.selector));
  });
}

/**
 * First-visit page tour driven by profiles.popup_states.
 * @param {{ key: string, steps: import('./tourSteps').TourStep[], ready?: boolean }} options
 */
export default function usePageTour({ key, steps, ready = true }) {
  const { popupStates, popupStatesLoaded, updatePopupState } = useUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [availableSteps, setAvailableSteps] = useState([]);

  const shouldShow = popupStatesLoaded && ready && popupStates && !popupStates[key];

  const refreshAvailable = useCallback(() => {
    const next = getAvailableSteps(steps);
    setAvailableSteps(next);
    return next;
  }, [steps]);

  useEffect(() => {
    if (!shouldShow) {
      setActive(false);
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;

    const tryStart = () => {
      if (cancelled) return;
      const next = refreshAvailable();
      if (next.length > 0) {
        setStepIndex(0);
        setActive(true);
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        window.setTimeout(tryStart, 150);
      }
    };

    // Wait a tick so page content / data-tour attrs mount
    const timer = window.setTimeout(tryStart, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shouldShow, refreshAvailable, key]);

  const currentStep = availableSteps[stepIndex] || null;
  const isLast = stepIndex >= availableSteps.length - 1;

  const complete = useCallback(() => {
    setActive(false);
    updatePopupState(key, true);
  }, [key, updatePopupState]);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const next = useCallback(() => {
    const refreshed = refreshAvailable();
    if (stepIndex >= refreshed.length - 1) {
      complete();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, refreshed.length - 1));
  }, [complete, refreshAvailable, stepIndex]);

  const goToStep = useCallback(
    (index) => {
      const refreshed = refreshAvailable();
      if (index < 0 || index >= refreshed.length) {
        complete();
        return;
      }
      setStepIndex(index);
    },
    [complete, refreshAvailable]
  );

  return useMemo(
    () => ({
      active,
      stepIndex,
      steps: availableSteps,
      currentStep,
      isLast,
      next,
      skip,
      complete,
      goToStep,
      totalSteps: availableSteps.length,
    }),
    [active, stepIndex, availableSteps, currentStep, isLast, next, skip, complete, goToStep]
  );
}
