import { createThemes } from "tw-colors";
const tailwindConfigModule = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      keyframes: {
        slideDash: {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0%)" },
        },
      },
      animation: {
        slideDash: "slideDash 4.5s infinite linear",
      },
    },
  },
  plugins: [
    createThemes(
      {
        light: {
          background: { DEFAULT: "#FFFFFF", offset: "#E3E3E3" },
          primary: {
            DEFAULT: "#843dff",
            50: "#f3f1ff",
            100: "#ebe5ff",
            200: "#d9ceff",
            300: "#bea6ff",
            400: "#9f75ff",
            500: "#843dff",
            600: "#7916ff",
            700: "#6b04fd",
            800: "#5a03d5",
            900: "#4b05ad",
            950: "#2c0076",
          },
          secondary: {
            DEFAULT: "#78a63c",
            50: "#f4f9ec",
            100: "#e7f2d5",
            200: "#d1e6b0",
            300: "#b3d581",
            400: "#96c15a",
            500: "#78a63c",
            600: "#5c842c",
            700: "#476526",
            800: "#3b5123",
            900: "#334621",
            950: "#19260d",
          },
          warning: {
            DEFAULT: "#de7c38",
            50: "#fdf7ef",
            100: "#faecda",
            200: "#f4d6b4",
            300: "#ecba85",
            400: "#e39454",
            500: "#de7c38",
            600: "#cf6127",
            700: "#ac4a22",
            800: "#893c23",
            900: "#6f331f",
            950: "#3c180e",
          },
          text: { primary: "#24143d" },
        },
        dark: {
          background: { DEFAULT: "#121212", offset: "#282828", interactive: "#3f3f3f" },
          primary: {
            DEFAULT: "#7a5af5",
            lighter: "#613286",
            darker: "#5e43f3",
          },
          secondary: {
            DEFAULT: "#ebd621",
            lighter: "#fff175",
            darker: "#a69500",
          },
          warning: {
            DEFAULT: "#720026",
            lighter: "#3354e6",
            darker: "#ce4257",
          },
          text: { primary: "#eae0d5" },
        },
      },
      { defaultTheme: { light: "light", dark: "dark" } }
    ),
  ],
};

export default tailwindConfigModule;
