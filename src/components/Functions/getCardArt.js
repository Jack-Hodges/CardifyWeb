import Leaves from '../../images/cardArt/leaves.webp';
import Rainbow from '../../images/cardArt/rainbow.webp';
import Stars from '../../images/cardArt/stars.PNG';
import Cat from '../../images/cardArt/Cats.png';

// Get array of theme assets and their URLs
export const getCardArtAssets = () => {
  return [
    { name: 'None', url: null },
    { name: 'Leaves', url: Leaves },
    { name: 'Rainbow', url: Rainbow },
    { name: 'Stars', url: Stars },
    { name: 'Cat', url: Cat },
  ];
};

// Memoize the card arts object since it never changes
const cardArts = {
  leaves: {
    image: `url(${Leaves})`,
  },
  rainbow: {
    image: `url(${Rainbow})`,
  },
  stars: {
    image: `url(${Stars})`,
  },
  cat: {
    image: `url(${Cat})`,
  },
};

export const getCardArt = (cardArt) => {
  if (!cardArt) {
    return { image: null };
  }
  return cardArts[cardArt] || { image: null };
};