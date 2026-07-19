/** @type {import('tailwindcss').Config} */
module.exports = {
  devtool: false,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    {
      pattern: /^bg-(red|sky|amber|rose|orange|lime|green|blue|yellow|gray|fuchsia|purple|pink|indigo|teal|cyan|emerald|violet|slate|stone|zinc)-(300|400|500|600|700|800)$/,
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
        'welcome-rise': {
          '0%': { transform: 'translateY(18px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'welcome-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'welcome-blob': {
          '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.15) translate(12px, -8px)' },
        },
      },
      animation: {
        'pop-up': 'pop-up 0.3s ease-in-out forwards',
        'pop-down': 'pop-down 0.3s ease-in-out forwards',
        'welcome-rise': 'welcome-rise 0.7s ease-out forwards',
        'welcome-rise-delayed': 'welcome-rise 0.7s ease-out 0.12s both',
        'welcome-rise-delayed-2': 'welcome-rise 0.7s ease-out 0.24s both',
        'welcome-float': 'welcome-float 5s ease-in-out infinite',
        'welcome-blob': 'welcome-blob 10s ease-in-out infinite',
        'welcome-blob-delayed': 'welcome-blob 12s ease-in-out 1.5s infinite',
      },

      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },

      screens: {
        '3xl': '1800px',
      },
      dropShadow: {
        'custom': '0 2px 4px rgba(0,0,0,1)'
      },
    },
  },
  plugins: [],
}

