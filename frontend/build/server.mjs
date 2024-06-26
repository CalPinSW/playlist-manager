import * as esbuild from "esbuild";
import { buildOptions } from "./build-common.mjs";
import http from "node:http";

const watchDirectories = ["src/*.{ts,tsx}"];

const runServer = async () => {
  const ctx = await esbuild.context(buildOptions);

  if (process.env.NODE_ENV == "development") {
    await ctx.watch();
  }

  let { host, port: proxyPort } = await ctx.serve({
    host: "localhost",
    servedir: "public",
  });

  http
    .createServer((clientReq, clientRes) => {
      const options = {
        hostname: host,
        port: proxyPort,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers,
      };

      const proxy = http.request(options, (res) => {
        if (res.statusCode === 404) {
          const redirectReq = http.request(
            { ...options, path: "/" },
            (proxyRes) => {
              clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
              proxyRes.pipe(clientRes, { end: true });
            }
          );

          redirectReq.end();
        } else {
          clientRes.writeHead(res.statusCode, res.headers);
          res.pipe(clientRes, { end: true });
        }
      });

      clientReq.pipe(proxy, { end: true });
    })
    .listen(process.env.FRONTEND_URL.split(":").slice(-1)[0]);
  console.log(`frontend running on ${process.env.FRONTEND_URL}`);
};

runServer();
