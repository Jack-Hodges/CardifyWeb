import Leaves from '../../images/cardArt/leaves.webp';
import Rainbow from '../../images/cardArt/rainbow.webp';
import Stars from '../../images/cardArt/stars.PNG';
import Cat from '../../images/cardArt/Cats.png';
import Flowers from '../../images/cardArt/Flowers.jpg';
import Petals from '../../images/cardArt/Petals.jpg';
import Moss from '../../images/cardArt/Moss.jpg';
import Clouds from '../../images/cardArt/Clouds.jpg';
import Butterflies from '../../images/cardArt/Butterflies.jpg';
import Galaxy from '../../images/cardArt/Galaxy.jpg';
import Nebula from '../../images/cardArt/Nebula.jpg';
import Lightning from '../../images/cardArt/Lightning.jpg';
import Paws from '../../images/cardArt/Paws.png';
import Hearts from '../../images/cardArt/Hearts.png';
import Doodles from '../../images/cardArt/Doodles.png';
import Splatter from '../../images/cardArt/Splatter.jpg';
import Shimmer from '../../images/cardArt/Shimmer.jpg';
import Ripple from '../../images/cardArt/Ripple.png';
import Topo from '../../images/cardArt/Topo.jpg';
import Hexagons from '../../images/cardArt/Hexagons.jpg';
import Dots from '../../images/cardArt/Dots.jpg';
import Grid from '../../images/cardArt/Grid.jpg';

export const CARD_ART_CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'nature', label: 'Nature' },
  { id: 'space', label: 'Space' },
  { id: 'cute', label: 'Cute' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'patterns', label: 'Patterns' },
];

export const normalizeCardArtKey = (name) => {
  if (!name || String(name).toLowerCase() === 'none') return 'none';
  return String(name).toLowerCase().replaceAll(' ', '');
};

// Get array of card art assets and their URLs
export const getCardArtAssets = () => [
  { name: 'None', url: null, category: 'basic' },
  { name: 'Leaves', url: Leaves, category: 'nature' },
  { name: 'Flowers', url: Flowers, category: 'nature' },
  { name: 'Petals', url: Petals, category: 'nature' },
  { name: 'Moss', url: Moss, category: 'nature' },
  { name: 'Clouds', url: Clouds, category: 'nature' },
  { name: 'Butterflies', url: Butterflies, category: 'nature' },
  { name: 'Stars', url: Stars, category: 'space' },
  { name: 'Galaxy', url: Galaxy, category: 'space' },
  { name: 'Nebula', url: Nebula, category: 'space' },
  { name: 'Lightning', url: Lightning, category: 'space' },
  { name: 'Cat', url: Cat, category: 'cute' },
  { name: 'Paws', url: Paws, category: 'cute' },
  { name: 'Hearts', url: Hearts, category: 'cute' },
  { name: 'Doodles', url: Doodles, category: 'cute' },
  { name: 'Rainbow', url: Rainbow, category: 'abstract' },
  { name: 'Splatter', url: Splatter, category: 'abstract' },
  { name: 'Shimmer', url: Shimmer, category: 'abstract' },
  { name: 'Ripple', url: Ripple, category: 'abstract' },
  { name: 'Topo', url: Topo, category: 'patterns' },
  { name: 'Hexagons', url: Hexagons, category: 'patterns' },
  { name: 'Dots', url: Dots, category: 'patterns' },
  { name: 'Grid', url: Grid, category: 'patterns' },
];

/** Card art grouped by category for the profile picker. */
export const getCardArtByCategory = () => {
  const assets = getCardArtAssets();
  const grouped = Object.fromEntries(CARD_ART_CATEGORIES.map((c) => [c.id, []]));

  assets.forEach((asset) => {
    const category = asset.category || 'basic';
    if (grouped[category]) {
      grouped[category].push(asset);
    }
  });

  return CARD_ART_CATEGORIES.map((category) => ({
    ...category,
    items: grouped[category.id] || [],
  })).filter((section) => section.items.length > 0);
};

const cardArts = {
  leaves: { image: `url(${Leaves})` },
  flowers: { image: `url(${Flowers})` },
  petals: { image: `url(${Petals})` },
  moss: { image: `url(${Moss})` },
  clouds: { image: `url(${Clouds})` },
  butterflies: { image: `url(${Butterflies})` },
  stars: { image: `url(${Stars})` },
  galaxy: { image: `url(${Galaxy})` },
  nebula: { image: `url(${Nebula})` },
  lightning: { image: `url(${Lightning})` },
  cat: { image: `url(${Cat})` },
  paws: { image: `url(${Paws})` },
  hearts: { image: `url(${Hearts})` },
  doodles: { image: `url(${Doodles})` },
  rainbow: { image: `url(${Rainbow})` },
  splatter: { image: `url(${Splatter})` },
  shimmer: { image: `url(${Shimmer})` },
  ripple: { image: `url(${Ripple})` },
  topo: { image: `url(${Topo})` },
  hexagons: { image: `url(${Hexagons})` },
  dots: { image: `url(${Dots})` },
  grid: { image: `url(${Grid})` },
};

export const getCardArt = (cardArt) => {
  if (!cardArt || cardArt === 'none') {
    return { image: null };
  }
  const key = normalizeCardArtKey(cardArt);
  return cardArts[key] || { image: null };
};
