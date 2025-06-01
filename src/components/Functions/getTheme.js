import Default from '../../images/backgrounds/Default.jpg';
import Beach from '../../images/backgrounds/Beach.jpg';
import Beach2 from '../../images/backgrounds/Beach2.jpg';
import Forest from '../../images/backgrounds/Forest.jpg';
import Mountain from '../../images/backgrounds/Mountain.jpg';
import NewYorkCity from '../../images/backgrounds/NewYorkCity.jpg';
import Serenity from '../../images/backgrounds/Serenity.jpg';
import Pastel from '../../images/backgrounds/Pastel.jpg';
import Geometric from '../../images/backgrounds/Geometric.jpg';
import Wood from '../../images/backgrounds/Wood.jpg';
import Fluidity from '../../images/backgrounds/Fluidity.jpg';
import PurpleGeometric from '../../images/backgrounds/PurpleGeometric.jpg'
import Nature1 from '../../images/backgrounds/Nature1.jpg'
import Space1 from '../../images/backgrounds/Space1.jpg'

// Get array of theme assets and their URLs
export const getThemeAssets = () => {
  return [
    { name: 'Default', url: Default },
    { name: 'Beach', url: Beach },
    { name: 'Beach 2', url: Beach2},
    { name: 'Forest', url: Forest },
    { name: 'Mountain', url: Mountain },
    { name: "New York City", url: NewYorkCity },
    { name: 'Serenity', url: Serenity },
    { name: 'Pastel', url: Pastel },
    { name: 'Geometric', url: Geometric},
    { name: 'Purple Geometric', url: PurpleGeometric },
    { name: 'Wood', url: Wood },
    { name: 'Fluidity', url: Fluidity },
    { name: 'Nature1', url: Nature1 },
    { name: 'Space1', url: Space1 },
  ];
};

// Default theme object
const defaultTheme = {
  name: "default",
  image: Default,
  color: 'rgba(3,15,64,1)',
  textClass: 'textColor',
  primary: ['green', 500],
  secondary: ['purple', 500],
  tertiary: ['orange', 500],
  border: ['green', 500],
  shadow: false,
};

// Memoize the themes object since it never changes
const themes = {
  beach: {
    name: "beach",
    image: `url(${Beach})`,
    color: 'rgba(226,219,150,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['cyan', 500],
    secondary: ['blue', 500],
    tertiary: ['yellow', 500],
    border: ['cyan', 500],
    shadow: true,
  },
  beach2: {
    name: "beach2",
    image: `url(${Beach2})`,
    color: 'rgba(68,118,128,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['cyan', 600],
    secondary: ['blue', 500],
    tertiary: ['stone', 400],
    border: ['cyan', 500],
    shadow: true,
  },
  forest: {
    name: "forest",
    image: `url(${Forest})`,
    color: 'rgba(58,110,76,1)',
    textClass: 'text-white',
    primary: ['green', 700],
    secondary: ['emerald', 600],
    tertiary: ['lime', 500],
    border: ['green', 700],
    shadow: true,
  },
  mountain: {
    name: "mountain",
    image: `url(${Mountain})`,
    color: 'rgba(117,117,117,1)',
    textClass: 'text-gray-100',
    primary: ['zinc', 700],
    secondary: ['stone', 400],
    tertiary: ['slate', 400],
    border: ['zinc', 700],
    shadow: true,
  },
  newyorkcity: {
    name: "newyorkcity",
    image: `url(${NewYorkCity})`,
    color: 'rgba(212,213,214,1)',
    textClass: 'text-gray-100',
    primary: ['zinc', 700],
    secondary: ['stone', 600],
    tertiary: ['slate', 400],
    border: ['zinc', 700],
    shadow: true,
  },
  serenity: {
    name: "serenity",
    image: `url(${Serenity})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['red', 700],
    secondary: ['orange', 500],
    tertiary: ['red', 300],
    boder: ['red', 700],
    shadow: true,
  },
  pastel: {
    name: "pastel",
    image: `url(${Pastel})`,
    color: 'rgba(206,190,176,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['violet', 300],
    secondary: ['emerald', 300],
    tertiary: ['blue', 300],
    border: ['blue', 500],
    shadow: true,
  },
  geometric: {
    name: "geometric",
    image: `url(${Geometric})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 600],
    secondary: ['violet', 500],
    tertiary: ['fuchsia', 400],
    border: ['blue', 600],
    shadow: true,
  },
  purplegeometric: {
    name: "purplegeometric",
    image: `url(${PurpleGeometric})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 800],
    secondary: ['violet', 500],
    tertiary: ['fuchsia', 400],
    border: ['blue', 600],
    shadow: true,
  },
  wood: {
    name: "wood",
    image: `url(${Wood})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['yellow', 800],
    secondary: ['orange', 800],
    tertiary: ['amber', 700],
    border: ['yellow', 800],
    shadow: true,
  },
  fluidity: {
    name: "motion",
    image: `url(${Fluidity})`,
    color: 'rgba(37,38,97,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 400],
    secondary: ['pink', 400],
    tertiary: ['yellow', 400],
    border: ['blue', 500],
    shadow: true,
  }, 
  nature1: {
    name: "nature1",
    image: `url(${Nature1})`,
    color: 'rgba(58,110,76,1)',
    textClass: 'text-white',
    primary: ['green', 700],
    secondary: ['emerald', 600],
    tertiary: ['lime', 500],
    border: ['green', 700],
    shadow: true,
  },
  space1: {
    name: "space1",
    image: `url(${Space1})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 800],
    secondary: ['violet', 500],
    tertiary: ['fuchsia', 400],
    border: ['blue', 600],
    shadow: true,
  },
};

export const getTheme = (theme) => {
  if (!theme) {
    return defaultTheme;
  }
  return themes[theme] || defaultTheme;
};