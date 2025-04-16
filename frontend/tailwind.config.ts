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
          background: { DEFAULT: "#FFFFFF", offset: "#E3E3E3", interactive: "#3f3f3f" },
          primary: {
            DEFAULT: "#843dff",
            lighter: "#bea6ff",
            darker: "#6b04fd",
          },
          secondary: {
            DEFAULT: "#78a63c",
            lighter: "#b3d581",
            darker: "#476526",
          },
          warning: {
            DEFAULT: "#de7c38",
            lighter: "#ecba85",
            darker: "#ac4a22",
          },
          text: { primary: "#24143d", secondary: "#aeacb0" },
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
          text: { primary: "#eae0d5", secondary: "#aeacb0" },
        },
      },
      { defaultTheme: { light: "light", dark: "dark" } }
    ),
  ],
};

export default tailwindConfigModule;
