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
      primary: ['green', 500],
      secondary: ['orange', 500],
      tertiary: ['purple', 500],
      border: ['green', 500],
    };
  } else {
    const themes = {
      beach: {
        name: "beach",
        image: `url(${Beach})`,
        shadowClass: `background-shadow-beach`,
        textClass: 'text-[rgb(245,241,230)]',
        primary: ['cyan', 500],
        secondary: ['blue', 500],
        tertiary: ['yellow', 500],
        border: ['cyan', 500],
      },
      forest: {
        name: "forest",
        image: `url(${Forest})`,
        shadowClass: `background-shadow-forest`,
        textClass: 'text-white',
        primary: ['green', 700],
        secondary: ['emerald', 600],
        tertiary: ['lime', 500],
        border: ['green', 700],
      },
      mountain: {
        name: "mountain",
        image: `url(${Mountain})`,
        shadowClass: `background-shadow-mountain`,
        textClass: 'text-gray-100',
        primary: ['zinc', 700],
        secondary: ['stone', 400],
        tertiary: ['slate', 400],
        border: ['zinc', 700],
      },
      newyorkcity: {
        name: "newyorkcity",
        image: `url(${NewYorkCity})`,
        shadowClass: `background-shadow-newyorkcity`,
        textClass: 'text-gray-100',
        primary: ['zinc', 700],
        secondary: ['stone', 400],
        tertiary: ['slate', 400],
        border: ['zinc', 700],
      },
      serenity: {
        name: "serenity",
        image: `url(${Serenity})`,
        shadowClass: 'background-shadow',
        textClass: 'text-[rgb(245,241,230)]',
        primary: ['red', 700],
        secondary: ['orange', 500],
        tertiary: ['red', 300],
        boder: ['red', 700],
      }
    };
    return themes[theme] || { name: "default", image: null, shadowClass: 'background-shadow', textClass: 'textColor', primary: ['green', 500], secondary: ['orange', 500], tertiary: ['purple', 500], border: ['green', 500] };
  }
};