import { config } from "dotenv";
config();

const define = {
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  "process.env.HOST": JSON.stringify(process.env.HOST || "localhost"),
};

export const buildOptions = {
  bundle: true,
  platform: "node",
  define,
  entryPoints: ["src/app.tsx"],
  outfile: "public/bundle.js",
};

export const devBuildOptions = Object.assign({}, buildOptions);
devBuildOptions.minify = false;
