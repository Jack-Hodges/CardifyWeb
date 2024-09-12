export const getColor = (color) => {
    switch (color) {
        case 'blue':
            return { bgClass: 'bg-blue-500', hoverClass: 'hover:bg-blue-400' };
        case 'red':
            return { bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-400' };
        case 'yellow':
            return { bgClass: 'bg-yellow-500', hoverClass: 'hover:bg-yellow-400' };
        case 'green':
            return { bgClass: 'bg-green-500', hoverClass: 'hover:bg-green-400' };
        case 'purple':
            return { bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-400' };
        case 'orange':
            return { bgClass: 'bg-orange-500', hoverClass: 'hover:bg-orange-400' };
        default:
            return { bgClass: 'bg-gray-500', hoverClass: 'hover:bg-gray-400' }; // Default color
    }
}