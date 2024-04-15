# Playlist Manager - Fronted

## System Requirements

This project requires NodeJS (version 18 or later) and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
6.4.1
v8.16.0
```

## Dependencies

The project uses npm to manage package dependencies. To install dependencies locally run the following from your preferred shell:

```bash
$ npm install
```

## Environment Variables

Environment variables are set in a `.env` file and should match the `.env.template` file. Currently the only variable that needs to be set is `HOST`. This can be localhost for local development. It is updated by ansible when provisioning VMs.

## Running the App

Once the all dependencies have been installed, start the React app in development mode by running:

```bash
$ npm run dev
```

You should see output similar to the following:

```bash
> playlist-manager-frontend@1.0.0 dev
> npm-run-all --parallel dev:*


> playlist-manager-frontend@1.0.0 dev:css
> npx tailwindcss -i ./src/index.css -o ./public/index.css --minify --watch


> playlist-manager-frontend@1.0.0 dev:esbuild
> node build/server.mjs

frontend running on http://127.0.0.1:1234

Rebuilding...

Done in 159ms.
```

If the [backend](../backend/README.md) is running you should be able to access the site at http://localhost:1234
