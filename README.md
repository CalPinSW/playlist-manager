# playlist-manager

## Basic set up

Requirements:

- Python
- Poetry
- Node & npm

`bash install.sh`

Set up an app registered at <https://developer.spotify.com/dashboard>

Set a Redirect URL for `http://localhost:1234`.

Create a `.env` file in the `backend` folder based on `.env.template`, and set the appropriate missing variables using those from the Spotify dashboard.

## Running it

Run the [backend](./backend/README.md) by first navigating to the backend folder with `cd backend` then running `poetry run flask run`

Run the [frontend](./frontend/README.md) by first navigating to the frontend folder with `cd frontend` then running `npm run dev`

> Note: You will need to install the requirements in each first.