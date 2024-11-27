function getColors(colorArray) {
  console.log(colorArray);
  if (!Array.isArray(colorArray) || colorArray.length !== 2) {
    throw new Error("Input must be an array with two elements: [color, intensity]");
  }

  const [color, intensity] = colorArray;

  if (typeof color !== "string" || typeof intensity !== "number") {
    throw new Error("Invalid input format. Expected [string, number].");
  }

  // Generate Tailwind classes
  const bgClass = `bg-${color}-${intensity}`;
  const hoverClass = `hover:bg-${color}-${intensity - 100}`;

  return { bgClass, hoverClass };
}

export default getColors;