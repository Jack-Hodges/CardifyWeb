/** @type {import('tailwindcss').Config} */
module.exports = {
  devtool: false,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    {
      pattern: /^bg-(red|amber|rose|orange|green|blue|yellow|gray|fuchsia|purple|pink|indigo|teal|cyan|emerald|violet)-(300|400|500|600|700|800)$/,
      variants: ['hover'],
    },
  ],
  theme: {
    extend: {
      keyframes: {
        'pop-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pop-down': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      animation: {
        'pop-up': 'pop-up 0.3s ease-in-out forwards',
        'pop-down': 'pop-down 0.3s ease-in-out forwards',
      },

      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },

      screens: {
        '3xl': '1800px',
      },
      dropShadow: {
        'custom': '0 2px 4px rgba(0,0,0,0.5)'
      }
    },
  },
  plugins: [],
}

