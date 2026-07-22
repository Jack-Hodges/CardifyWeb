import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { dismissToast, subscribeToasts } from './toastStore';

const VARIANT = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-green-500',
    iconWrap: 'bg-green-500/90',
  },
  error: {
    icon: XCircle,
    accent: 'bg-red-500',
    iconWrap: 'bg-red-500/90',
  },
  info: {
    icon: Info,
    accent: 'bg-blue-500',
    iconWrap: 'bg-blue-500/90',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-orange-500',
    iconWrap: 'bg-orange-500/90',
  },
};

function ToastItem({ item }) {
  const [leaving, setLeaving] = useState(false);
  const variant = VARIANT[item.type] || VARIANT.info;
  const Icon = variant.icon;

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => dismissToast(item.id), 220);
  };

  useEffect(() => {
    if (!item.autoClose || item.autoClose <= 0) return undefined;
    const timer = window.setTimeout(close, item.autoClose);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.autoClose]);

  const body =
    typeof item.content === 'function'
      ? item.content({ closeToast: close })
      : item.content;

  return (
    <div
      role="status"
      className={`pointer-events-auto w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-white/20
        bg-gradient-to-t from-black/40 via-black/25 to-black/15 backdrop-blur-xl
        shadow-2xl shadow-black/40 text-white
        transform transition-all duration-200 ease-out
        ${leaving ? 'opacity-0 translate-y-[-8px] scale-95' : 'opacity-100 translate-y-0 scale-100 animate-pop-up'}`}
    >
      <div className={`h-1 ${variant.accent}`} />
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className={`shrink-0 w-9 h-9 rounded-full ${variant.iconWrap} flex items-center justify-center text-white`}
        >
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5 text-sm sm:text-base font-semibold leading-snug">
          {typeof body === 'string' ? <p>{body}</p> : body}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={close}
          className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] sm:top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {items.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </div>,
    document.body
  );
}

export default ToastViewport;
