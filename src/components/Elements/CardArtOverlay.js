/**
 * Decorative card-art layer for subject tiles and collection previews.
 * Slightly oversized inset avoids uncovered corners on rounded cards.
 */
export default function CardArtOverlay({ image, className = '', opacity = 0.85 }) {
  if (!image) return null;

  return (
    <div
      className={`absolute -inset-1 pointer-events-none bg-cover bg-center bg-no-repeat ${className}`}
      style={{
        backgroundImage: image,
        opacity,
      }}
      aria-hidden
    />
  );
}
