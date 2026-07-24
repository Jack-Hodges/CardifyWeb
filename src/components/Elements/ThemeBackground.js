/**
 * Single theme backdrop. Uses CSS vars set by UserContext.
 *
 * Mobile: absolute fill of the page container (scrolls with content / iOS-safe).
 * Desktop: fixed viewport layer so large screens never tile the image.
 */
function ThemeBackground({ shadow = false }) {
  const style = {
    backgroundColor: 'var(--theme-background-color)',
    backgroundImage: 'var(--theme-background-image)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <>
      <div
        className="absolute inset-0 sm:hidden bg-cover bg-center bg-no-repeat z-0"
        style={style}
        aria-hidden="true"
      />
      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={style}
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
