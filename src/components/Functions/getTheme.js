import beach from '../../images/backgrounds/Beach.jpg';
import forest from '../../images/backgrounds/Forest.jpg';

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
                image: `url(${beach})`,
                shadowClass: `background-shadow-beach`,
                textClass: 'text-[rgb(245,241,230)]',
                primary: 'cyan',
                secondary: 'sky',
                tertiary: 'yellow',
            },
            // Additional themes can be added here
            // Example:
            forest: {
                image: `url(${forest})`,
                shadowClass: `background-shadow-forest`,
                textClass: 'text-white',
                primary: 'green',
                secondary: 'orange',
                tertiary: 'purple',
            },
            // mountain: {
            //     image: `url(${mountain})`,
            //     shadowClass: `background-shadow-mountain`,
            //     textClass: 'text-[some color]'
            // }
        };

        return themes[theme] || { image: null, shadowClass: 'background-shadow', textClass: 'textColor', primary: 'green', secondary: 'orange', tertiary: 'purple' };
    }
};