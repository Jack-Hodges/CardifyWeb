const getColors = (colorName, value) => {
    // Validate the value is a number between 100-900
    if (!Number.isInteger(value) || value < 100 || value > 900 || value % 100 !== 0) {
      throw new Error('Value must be a multiple of 100 between 100 and 900');
    }
  
    // Calculate hover value (100 less intense, so subtract 100)
    const hoverValue = Math.max(100, value - 100);
  
    return {
      bgClass: `bg-${colorName}-${value}`,
      bgHover: `hover:bg-${colorName}-${hoverValue}`,
      textClass: `text-${colorName}-${value}`
    };
  };
  
  // Example usage:
  // const { bgClass, bgHover, textClass } = useColorClasses('red', 400);
  // Result: 
  // bgClass: 'bg-red-400'
  // bgHover: 'hover:bg-red-300'
  // textClass: 'text-red-400'
  
  export default getColors;