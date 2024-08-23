import * as esbuild from "esbuild";
import { buildOptions } from "./build-common.mjs";
import http from "node:http";

const runServer = async () => {
	const ctx = await esbuild.context(buildOptions);

	if (process.env.NODE_ENV == "development") {
		await ctx.watch();
	}

	let { host, port: proxyPort } = await ctx.serve({
		host: "localhost",
		servedir: "public",
	});

	const foo = http
		.createServer((clientReq, clientRes) => {
			const options = {
				hostname: host,
				port: proxyPort,
				path: clientReq.url,
				method: clientReq.method,
				headers: clientReq.headers,
			};

			const proxy = http.request(options, res => {
				if (res.statusCode === 404) {
					const redirectReq = http.request(
						{ ...options, path: "/" },
						proxyRes => {
							clientRes.writeHead(
								proxyRes.statusCode,
								proxyRes.headers,
							);
							proxyRes.pipe(clientRes, { end: true });
						},
					);

					redirectReq.end();
				} else {
					clientRes.writeHead(res.statusCode, res.headers);
					res.pipe(clientRes, { end: true });
				}
			});

			clientReq.pipe(proxy, { end: true });
		})
		.listen("8080");
	console.log(`frontend running on port ${foo.address().port}`);
};

runServer();
