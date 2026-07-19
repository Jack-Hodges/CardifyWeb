/**
 * Single fixed theme backdrop. Background value comes from --theme-background
 * set by UserContext whenever the theme changes.
 */
function ThemeBackground({ shadow = false }) {
  return (
    <>
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
        style={{
          background: 'var(--theme-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      />
      {shadow && (
        <div
          className="fixed top-0 left-0 w-full h-2/5 bg-gradient-to-b from-[rgba(0,0,0,0.2)] to-transparent z-[5] pointer-events-none"
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default ThemeBackground;
