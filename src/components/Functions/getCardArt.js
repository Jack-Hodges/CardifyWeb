import Leaves from '../../images/cardArt/leaves.webp';

// Get array of theme assets and their URLs
export const getCardArtAssets = () => {
  return [
    { name: 'None', url: null },
    { name: 'Leaves', url: Leaves },
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
    };
    return cardArts[cardArt] || { image: null };
  }
};