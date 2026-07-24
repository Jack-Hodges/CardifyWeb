import { useEffect } from 'react';

const SCROLL_LOCK_CLASS = 'scroll-locked';

let lockCount = 0;
let savedScrollY = 0;

function isScrollableElement(element) {
  let node = element;

  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScrollY =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight;

    if (canScrollY) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
}

function preventBackgroundTouchMove(event) {
  if (isScrollableElement(event.target)) {
    return;
  }

  event.preventDefault();
}

function lockBody() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.documentElement.classList.add(SCROLL_LOCK_CLASS);
    document.addEventListener('touchmove', preventBackgroundTouchMove, { passive: false });
  }
  lockCount += 1;
}

function unlockBody() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  document.removeEventListener('touchmove', preventBackgroundTouchMove);
  document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
  window.scrollTo(0, savedScrollY);
}

/**
 * Prevents background scroll while a modal/overlay is open.
 * Uses a ref-count so nested modals don't unlock early.
 *
 * Avoids `position: fixed` on body — that pattern fights document scrolling
 * on iOS Safari and forces the browser chrome/search bar to expand.
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    lockBody();
    return unlockBody;
  }, [locked]);
}
