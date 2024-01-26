import * as esbuild from "esbuild";
import { buildOptions } from "./build-common.mjs";
import liveServer from "live-server";

const watchDirectories = ["src/*.{ts,tsx}"];

const runServer = async () => {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();

  liveServer.start({
    open: true,
    port: +process.env.PORT || 8080,
    root: "public",
  });
};

runServer();
