# Playlist Manager - Mobile Frontend

## System Requirements

Requires an emulator

## Dependencies

The project uses npm to manage package dependencies. To install dependencies locally run the following from your preferred shell:

```bash
$ npm install
```

## Environment Variables

Environment variables are set in a `.env` file and should match the `.env.template` file. Currently the only variables that needs to be set are `FRONTEND_URL` and `BACKEND_URL`. This can be localhost for local development. It is updated by ansible when provisioning VMs.

## Running the App

Once the all dependencies have been installed, start the React app in development mode by running:

```bash
$ npm start
```

You should see output similar to the following:

```bash
> playlist-manager-frontend@1.0.0 dev
> npm-run-all --parallel dev:*


> playlist-manager-frontend@1.0.0 dev:css
> npx tailwindcss -i ./src/index.css -o ./public/index.css --minify --watch


> playlist-manager-frontend@1.0.0 dev:esbuild
> node build/server.mjs

frontend running on http://127.0.0.1:8080

Rebuilding...

Done in 159ms.
```

If the [backend](../backend/README.md) is running you should be able to access the site at http://localhost:8080
