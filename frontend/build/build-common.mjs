import { config } from "dotenv";

config();

const define = {
	"process.env.NODE_ENV": JSON.stringify(
		process.env.NODE_ENV || "development",
	),
	"process.env.BACKEND_URL": JSON.stringify(
		process.env.BACKEND_URL || "http://localhost:5000",
	),
	"process.env.USE_CORS": process.env.USE_CORS || false,
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
