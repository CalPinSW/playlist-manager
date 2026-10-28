/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mirrors constants/colors.ts ("liner notes" palette) — keep in sync
        bg: '#14110f',            // page background
        surface: {
          DEFAULT: '#1f1a16',     // cards
          raised: '#29231e',
        },
        text: {
          DEFAULT: '#efe6d8',     // primary text
          muted: '#a89b8a',       // secondary text
          faint: '#6e6357',
        },
        border: '#332b25',
        accent: '#e8552d',        // playing / current / primary action
        success: '#8fa77a',       // finished / promoted
        rating: '#d9a441',        // stars
        danger: '#ff7a6b',
      },
      fontFamily: {
        // SF Pro is the system font on iOS — referenced by name in RN
        sans: ['System'],
        display: ['Fraunces_600SemiBold'],
      }
    }
  },
  plugins: []
};
