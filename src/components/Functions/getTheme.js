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
import PurpleGeometric from '../../images/backgrounds/PurpleGeometric.jpg';
import Nature1 from '../../images/backgrounds/Nature1.jpg';
import Space1 from '../../images/backgrounds/Space1.jpg';
import Aurora from '../../images/backgrounds/Aurora.jpg';
import Desert from '../../images/backgrounds/Desert.jpg';
import Library from '../../images/backgrounds/Library.jpg';
import OceanNight from '../../images/backgrounds/OceanNight.jpg';
import Paper from '../../images/backgrounds/Paper.jpg';
import NeonCity from '../../images/backgrounds/NeonCity.jpg';
import Bloom from '../../images/backgrounds/Bloom.jpg';
import Marble from '../../images/backgrounds/Marble.jpg';
import Waves from '../../images/backgrounds/Waves.jpg';
import Mesh from '../../images/backgrounds/Mesh.jpg';
import Prism from '../../images/backgrounds/Prism.jpg';
import Ink from '../../images/backgrounds/Ink.jpg';

export const THEME_CATEGORIES = [
  { id: 'classic', label: 'Classic' },
  { id: 'nature', label: 'Nature' },
  { id: 'city', label: 'City' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'cozy', label: 'Cozy' },
  { id: 'space', label: 'Space' },
];

/** Ensure a value is a valid CSS background image/color string. */
export const normalizeBackgroundImage = (value) => {
  if (value == null || value === '') return '';
  const v = String(value);
  if (
    v.startsWith('url(') ||
    v.startsWith('linear-gradient') ||
    v.startsWith('radial-gradient') ||
    v.startsWith('#') ||
    v.startsWith('rgb') ||
    v.startsWith('hsl')
  ) {
    return v;
  }
  return `url(${v})`;
};

export const normalizeThemeKey = (name) => {
  if (!name) return 'default';
  return String(name).toLowerCase().replaceAll(' ', '');
};

// Get array of theme assets and their URLs
export const getThemeAssets = () => {
  // Get current color scheme for default theme preview
  let defaultPreview = Default;
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    defaultPreview = prefersDark
      ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      : '#f1ebe0';
  }

  return [
    { name: 'Default', url: defaultPreview, category: 'classic' },
    { name: 'Paper', url: Paper, category: 'classic' },
    { name: 'Beach', url: Beach, category: 'nature' },
    { name: 'Beach 2', url: Beach2, category: 'nature' },
    { name: 'Forest', url: Forest, category: 'nature' },
    { name: 'Mountain', url: Mountain, category: 'nature' },
    { name: 'Nature1', url: Nature1, category: 'nature' },
    { name: 'Desert', url: Desert, category: 'nature' },
    { name: 'Ocean Night', url: OceanNight, category: 'nature' },
    { name: 'New York City', url: NewYorkCity, category: 'city' },
    { name: 'Neon City', url: NeonCity, category: 'city' },
    { name: 'Pastel', url: Pastel, category: 'abstract' },
    { name: 'Geometric', url: Geometric, category: 'abstract' },
    { name: 'Purple Geometric', url: PurpleGeometric, category: 'abstract' },
    { name: 'Fluidity', url: Fluidity, category: 'abstract' },
    { name: 'Bloom', url: Bloom, category: 'abstract' },
    { name: 'Marble', url: Marble, category: 'abstract' },
    { name: 'Waves', url: Waves, category: 'abstract' },
    { name: 'Mesh', url: Mesh, category: 'abstract' },
    { name: 'Prism', url: Prism, category: 'abstract' },
    { name: 'Ink', url: Ink, category: 'abstract' },
    { name: 'Wood', url: Wood, category: 'cozy' },
    { name: 'Serenity', url: Serenity, category: 'cozy' },
    { name: 'Library', url: Library, category: 'cozy' },
    { name: 'Space1', url: Space1, category: 'space' },
    { name: 'Aurora', url: Aurora, category: 'space' },
  ];
};

/** Themes grouped by category for the profile picker. */
export const getThemesByCategory = () => {
  const assets = getThemeAssets();
  const grouped = Object.fromEntries(THEME_CATEGORIES.map((c) => [c.id, []]));

  assets.forEach((asset) => {
    const category = asset.category || 'classic';
    if (grouped[category]) {
      grouped[category].push(asset);
    }
  });

  return THEME_CATEGORIES.map((category) => ({
    ...category,
    themes: grouped[category.id] || [],
  })).filter((section) => section.themes.length > 0);
};

// Default theme object with dynamic light/dark mode
const getDefaultTheme = (manualColorScheme = null) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use manual color scheme if provided, otherwise check system preference
    const isDark = manualColorScheme ? manualColorScheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark) {
      return {
        name: 'default',
        image: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: 'rgba(56,57,59,1)',
        textClass: 'text-gray-200',
        primary: ['green', 500],
        secondary: ['purple', 500],
        tertiary: ['orange', 500],
        border: ['green', 500],
        shadow: false,
      };
    }

    return {
      name: 'default',
      image: '#f1ebe0',
      color: 'rgba(3,15,64,1)',
      textClass: 'text-gray-700',
      primary: ['green', 500],
      secondary: ['purple', 500],
      tertiary: ['orange', 500],
      border: ['green', 500],
      shadow: false,
    };
  }

  // Fallback for SSR or when window is not available
  return {
    name: 'default',
    image: `url(${Default})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'textColor',
    primary: ['green', 500],
    secondary: ['purple', 500],
    tertiary: ['orange', 500],
    border: ['green', 500],
    shadow: false,
  };
};

// Memoize the themes object since it never changes
const themes = {
  beach: {
    name: 'beach',
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
    name: 'beach2',
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
    name: 'forest',
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
    name: 'mountain',
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
    name: 'newyorkcity',
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
    name: 'serenity',
    image: `url(${Serenity})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['red', 700],
    secondary: ['orange', 500],
    tertiary: ['red', 300],
    border: ['red', 700],
    shadow: true,
  },
  pastel: {
    name: 'pastel',
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
    name: 'geometric',
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
    name: 'purplegeometric',
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
    name: 'wood',
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
    name: 'fluidity',
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
    name: 'nature1',
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
    name: 'space1',
    image: `url(${Space1})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 800],
    secondary: ['violet', 500],
    tertiary: ['fuchsia', 400],
    border: ['blue', 600],
    shadow: true,
  },
  aurora: {
    name: 'aurora',
    image: `url(${Aurora})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['teal', 600],
    secondary: ['cyan', 500],
    tertiary: ['emerald', 500],
    border: ['teal', 600],
    shadow: true,
  },
  desert: {
    name: 'desert',
    image: `url(${Desert})`,
    color: 'rgba(180,120,60,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['amber', 600],
    secondary: ['orange', 600],
    tertiary: ['yellow', 600],
    border: ['amber', 600],
    shadow: true,
  },
  library: {
    name: 'library',
    image: `url(${Library})`,
    color: 'rgba(120,80,40,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['amber', 700],
    secondary: ['orange', 700],
    tertiary: ['yellow', 700],
    border: ['amber', 700],
    shadow: true,
  },
  oceannight: {
    name: 'oceannight',
    image: `url(${OceanNight})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 700],
    secondary: ['cyan', 600],
    tertiary: ['sky', 500],
    border: ['blue', 700],
    shadow: true,
  },
  paper: {
    name: 'paper',
    image: `url(${Paper})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-gray-700',
    primary: ['stone', 600],
    secondary: ['amber', 600],
    tertiary: ['orange', 500],
    border: ['stone', 600],
    shadow: false,
  },
  neoncity: {
    name: 'neoncity',
    image: `url(${NeonCity})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['cyan', 600],
    secondary: ['pink', 500],
    tertiary: ['violet', 500],
    border: ['cyan', 600],
    shadow: true,
  },
  bloom: {
    name: 'bloom',
    image: `url(${Bloom})`,
    color: 'rgba(206,190,176,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['pink', 500],
    secondary: ['fuchsia', 400],
    tertiary: ['emerald', 400],
    border: ['pink', 500],
    shadow: true,
  },
  marble: {
    name: 'marble',
    image: `url(${Marble})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-gray-700',
    primary: ['stone', 600],
    secondary: ['slate', 500],
    tertiary: ['amber', 600],
    border: ['stone', 600],
    shadow: false,
  },
  waves: {
    name: 'waves',
    image: `url(${Waves})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['blue', 600],
    secondary: ['violet', 500],
    tertiary: ['cyan', 500],
    border: ['blue', 600],
    shadow: true,
  },
  mesh: {
    name: 'mesh',
    image: `url(${Mesh})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['fuchsia', 500],
    secondary: ['orange', 500],
    tertiary: ['violet', 500],
    border: ['fuchsia', 500],
    shadow: true,
  },
  prism: {
    name: 'prism',
    image: `url(${Prism})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-[rgb(245,241,230)]',
    primary: ['violet', 600],
    secondary: ['cyan', 500],
    tertiary: ['fuchsia', 400],
    border: ['violet', 600],
    shadow: true,
  },
  ink: {
    name: 'ink',
    image: `url(${Ink})`,
    color: 'rgba(3,15,64,1)',
    textClass: 'text-white',
    primary: ['slate', 600],
    secondary: ['indigo', 600],
    tertiary: ['sky', 500],
    border: ['slate', 600],
    shadow: true,
  },
};

export const getTheme = (theme, manualColorScheme = null) => {
  const key = theme ? String(theme).toLowerCase().replaceAll(' ', '') : null;
  if (!key || key === 'default') {
    return getDefaultTheme(manualColorScheme);
  }
  return themes[key] || getDefaultTheme(manualColorScheme);
};
