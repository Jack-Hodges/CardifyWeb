let listeners = [];
let toasts = [];
let idCounter = 0;

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function push(type, content, options = {}) {
  const id = ++idCounter;
  const toast = {
    id,
    type,
    content,
    autoClose: options.autoClose ?? 3000,
  };
  toasts = [...toasts, toast];
  emit();
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener) {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Drop-in style API compatible with the react-toastify calls used in this app.
 */
export const toast = {
  success: (content, options) => push('success', content, options),
  error: (content, options) => push('error', content, options),
  info: (content, options) => push('info', content, options),
  warning: (content, options) => push('warning', content, options),
  dismiss: dismissToast,
};
