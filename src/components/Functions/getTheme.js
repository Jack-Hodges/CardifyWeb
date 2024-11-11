import beach from '../../images/backgrounds/Beach.jpg';

export const getTheme = (theme) => {
    console.log("getting theme");

    if (!theme) {
        return {
            image: null,
            shadowClass: 'background-shadow',
            textClass: 'textColor'
        };
    } else {
        const themes = {
            beach: {
                image: `url(${beach})`,
                shadowClass: `background-shadow-beach`,
                textClass: 'text-[rgb(245,241,230)]'
            },
            // Additional themes can be added here
            // Example:
            // forest: {
            //     image: `url(${forest})`,
            //     shadowClass: `background-shadow-forest`,
            //     textClass: 'text-[some color]'
            // },
            // mountain: {
            //     image: `url(${mountain})`,
            //     shadowClass: `background-shadow-mountain`,
            //     textClass: 'text-[some color]'
            // }
        };

        return themes[theme] || { image: null, shadowClass: 'background-shadow', textClass: 'textColor' };
    }
};