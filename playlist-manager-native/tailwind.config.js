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
        // Design system tokens (matching web app design review decisions)
        primary: '#843dff',       // purple accent — CTAs, active tab
        secondary: '#78a63c',     // green — promote button, completion
        surface: {
          DEFAULT: '#1a1030',     // card background
          dark: '#0f0a1e',        // page background
        },
        text: {
          DEFAULT: '#f0ecff',     // primary text
          muted: '#9d8ec4',       // secondary text
        },
        border: '#2d1f5e',        // subtle borders
      },
      fontFamily: {
        // SF Pro is the system font on iOS — referenced by name in RN
        sans: ['System'],
      }
    }
  },
  plugins: []
};
