const tailwindConfigModule = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
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
          50: "#f4f9ec",
          "100": "#e7f2d5",
          "200": "#d1e6b0",
          "300": "#b3d581",
          "400": "#96c15a",
          "500": "#78a63c",
          "600": "#5c842c",
          "700": "#476526",
          "800": "#3b5123",
          "900": "#334621",
          "950": "#19260d",
        },
        warning: {
          "50": "#fdf7ef",
          "100": "#faecda",
          "200": "#f4d6b4",
          "300": "#ecba85",
          "400": "#e39454",
          "500": "#de7c38",
          "600": "#cf6127",
          "700": "#ac4a22",
          "800": "#893c23",
          "900": "#6f331f",
          "950": "#3c180e",
        },
        text: { primary: "#24143d" },
      },
    },
  },
  plugins: [],
};

export default tailwindConfigModule;
