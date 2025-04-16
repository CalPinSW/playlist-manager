interface ColourShades {
  default: string,
  lighter: string,
  darker: string,
}

interface IColours {
  background: {
    default: string, offset: string, interactive: string
  },
  text: {primary: string, secondary: string}
  primary: ColourShades,
  secondary: ColourShades,
  warning: ColourShades,
}

export interface ColourScheme {
  light: IColours,
  dark: IColours
}

const Colours: ColourScheme = {
  light: {
    background: { default: "#FFFFFF", offset: "#E3E3E3", interactive: "#3f3f3f" },
    primary: {
      default: "#843dff",
      lighter: "#bea6ff",
      darker: "#6b04fd",
    },
    secondary: {
      default: "#78a63c",
      lighter: "#b3d581",
      darker: "#476526",
    },
    warning: {
      default: "#de7c38",
      lighter: "#ecba85",
      darker: "#ac4a22",
    },
    text: { primary: "#24143d", secondary: "#aeacb0" },
  },
  dark: {
    background: { default: "#121212", offset: "#282828", interactive: "#3f3f3f" },
    primary: {
      default: "#7a5af5",
      lighter: "#613286",
      darker: "#5e43f3",
    },
    secondary: {
      default: "#ebd621",
      lighter: "#fff175",
      darker: "#a69500",
    },
    warning: {
      default: "#720026",
      lighter: "#3354e6",
      darker: "#ce4257",
    },
    text: { primary: "#eae0d5", secondary: "#aeacb0" },
  },
};

export default Colours;
