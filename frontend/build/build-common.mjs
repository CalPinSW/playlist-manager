export const buildOptions = {
  bundle: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  entryPoints: ["src/app.tsx"],
  minify: true,
  outfile: "public/bundle.js",
};

export const devBuildOptions = Object.assign({}, buildOptions);
devBuildOptions.minify = false;
