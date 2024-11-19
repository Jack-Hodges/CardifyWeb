import Beach from '../../images/backgrounds/Beach.jpg';
import Forest from '../../images/backgrounds/Forest.jpg';
import Mountain from '../../images/backgrounds/Mountain.jpg';
import NewYorkCity from '../../images/backgrounds/NewYorkCity.jpg';
import Serenity from '../../images/backgrounds/Serenity.jpg';

// Get array of theme assets and their URLs
export const getThemeAssets = () => {
  return [
    { name: 'Beach', url: Beach },
    { name: 'Forest', url: Forest },
    { name: 'Mountain', url: Mountain },
    { name: "New York City", url: NewYorkCity },
    { name: 'Serenity', url: Serenity },
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
        name: "beach",
        image: `url(${Beach})`,
        shadowClass: `background-shadow-beach`,
        textClass: 'text-[rgb(245,241,230)]',
        primary: 'cyan',
        secondary: 'blue',
        tertiary: 'yellow',
      },
      forest: {
        name: "forest",
        image: `url(${Forest})`,
        shadowClass: `background-shadow-forest`,
        textClass: 'text-white',
        primary: 'darkGreen',
        secondary: 'darkEmerald',
        tertiary: 'lime',
      },
      mountain: {
        name: "mountain",
        image: `url(${Mountain})`,
        shadowClass: `background-shadow-mountain`,
        textClass: 'text-gray-100',
        primary: 'zinc',
        secondary: 'stone',
        tertiary: 'slate',
      },
      newyorkcity: {
        name: "newyorkcity",
        image: `url(${NewYorkCity})`,
        shadowClass: `background-shadow-newyorkcity`,
        textClass: 'text-gray-100',
        primary: 'zinc',
        secondary: 'stone',
        tertiary: 'slate',
      },
      serenity: {
        name: "serenity",
        image: `url(${Serenity})`,
        shadowClass: 'background-shadow',
        textClass: 'text-[rgb(245,241,230)]',
        primary: 'darkRed',
        secondary: 'orange',
        tertiary: 'lightRed',
      }
    };
    return themes[theme] || { name: "default", image: null, shadowClass: 'background-shadow', textClass: 'textColor', primary: 'green', secondary: 'orange', tertiary: 'purple' };
  }
};