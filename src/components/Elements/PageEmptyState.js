// Shared layout for full-page empty, loading, and completion states.
// Uses dvh minus the title bar so content is vertically centred on every page.
export const PAGE_EMPTY_STATE_CLASS =
  'flex flex-col justify-center items-center w-full min-h-[calc(100dvh-5.5rem)] px-4';

export default function PageEmptyState({ children }) {
  return <div className={PAGE_EMPTY_STATE_CLASS}>{children}</div>;
}
