import * as esbuild from "esbuild";
import { buildOptions } from "./build-common.mjs";

esbuild.build(buildOptions).then(() => {
  console.log("Done");
  process.exit();
});
