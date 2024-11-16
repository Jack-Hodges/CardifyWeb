import Beach from '../../images/backgrounds/Beach.jpg';
import Forest from '../../images/backgrounds/Forest.jpg';
import Mountain from '../../images/backgrounds/Mountain.jpg';

// Get array of theme assets and their URLs
export const getThemeAssets = () => {
  return [
    { name: 'Beach', url: Beach },
    { name: 'Forest', url: Forest },
    { name: 'Mountain', url: Mountain }
  ];
};

export const getTheme = (theme) => {
  console.log("getting theme");
  if (!theme) {
    return {
      image: null,
      shadowClass: 'background-shadow',
      textClass: 'textColor',
      primary: 'green',
      secondary: 'orange',
      tertiary: 'purple',
    };
  } else {
    const themes = {
      beach: {
        image: `url(${Beach})`,
        shadowClass: `background-shadow-beach`,
        textClass: 'text-[rgb(245,241,230)]',
        primary: 'cyan',
        secondary: 'blue',
        tertiary: 'yellow',
      },
      forest: {
        image: `url(${Forest})`,
        shadowClass: `background-shadow-forest`,
        textClass: 'text-white',
        primary: 'darkGreen',
        secondary: 'darkEmerald',
        tertiary: 'lime',
      },
      mountain: {
        image: `url(${Mountain})`,
        shadowClass: `background-shadow-mountain`,
        textClass: 'text-gray-100',
        primary: 'zinc',
        secondary: 'stone',
        tertiary: 'slate',
      }
    };
    return themes[theme] || { image: null, shadowClass: 'background-shadow', textClass: 'textColor', primary: 'green', secondary: 'orange', tertiary: 'purple' };
  }
};