const colorMap = {
    blue: { bgClass: 'bg-blue-500', hoverClass: 'hover:bg-blue-400' },
    red: { bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-400' },
    yellow: { bgClass: 'bg-yellow-500', hoverClass: 'hover:bg-yellow-400' },
    green: { bgClass: 'bg-green-500', hoverClass: 'hover:bg-green-400' },
    purple: { bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-400' },
    orange: { bgClass: 'bg-orange-500', hoverClass: 'hover:bg-orange-400' },
    emerald: { bgClass: 'bg-emerald-400', hoverClass: 'hover:bg-emerald-300' },
    violet: { bgClass: 'bg-violet-400', hoverClass: 'hover:bg-violet-300' },
    pink: { bgClass: 'bg-pink-500', hoverClass: 'hover:bg-pink-400' },
    sky: { bgClass: 'bg-sky-300', hoverClass: 'hover:bg-sky-200' },
    cyan: { bgClass: 'bg-cyan-500', hoverClass: 'hover:bg-cyan-400' },
    teal: { bgClass: 'bg-teal-500', hoverClass: 'hover:bg-teal-400' },
    lime: { bgClass: 'bg-lime-500', hoverClass: 'hover:bg-lime-400' },
    amber: { bgClass: 'bg-amber-500', hoverClass: 'hover:bg-amber-400' },
    darkGreen: { bgClass: 'bg-green-700', hoverClass: 'hover:bg-green-600' },
    darkEmerald: { bgClass: 'bg-emerald-600', hoverClass: 'hover:bg-emerald-500' },
    default: { bgClass: 'bg-gray-500', hoverClass: 'hover:bg-gray-400' }
};

export const getColor = (color) => colorMap[color] || colorMap.default;
