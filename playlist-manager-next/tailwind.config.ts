const tailwindConfigModule = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: "class",

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
      colors: {
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
    },
  },
};

export default tailwindConfigModule;
