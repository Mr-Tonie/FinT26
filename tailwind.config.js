/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0e9fe',
          200: '#c1d3fe',
          300: '#91b1fd',
          400: '#5a87fa',
          500: '#305cde', // Your highlight blue
          600: '#2323ff', // Your vibrant blue
          700: '#0F52BA', // Your Sapphire Royal blue
          800: '#0047ab', // Your Duke/Deep blue
          900: '#0a1d5a', // Darkest professional depth
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
    },
  },
  plugins: [],
}