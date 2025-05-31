import Leaves from '../../images/cardArt/leaves.webp';
import Rainbow from '../../images/cardArt/rainbow.webp';

// Get array of theme assets and their URLs
export const getCardArtAssets = () => {
  return [
    { name: 'None', url: null },
    { name: 'Leaves', url: Leaves },
    { name: 'Rainbow', url: Rainbow },
  ];
};

export const getCardArt = (cardArt) => {
  console.log("getting card art");
  if (!cardArt) {
    return {
      image: null,
    };
  } else {
    const cardArts = {
      leaves: {
        image: `url(${Leaves})`,
      },
      rainbow: {
        image: `url(${Rainbow})`,
      },
    };
    return cardArts[cardArt] || { image: null };
  }
};