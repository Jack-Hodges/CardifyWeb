// Shared layout for full-page empty, loading, and completion states.
// Uses lvh minus the title bar so content can extend under iOS Safari chrome.
export const PAGE_EMPTY_STATE_CLASS =
  'flex flex-col justify-center items-center w-full min-h-[calc(100lvh-5.5rem)] px-4';

export default function PageEmptyState({ children }) {
  return <div className={PAGE_EMPTY_STATE_CLASS}>{children}</div>;
}
