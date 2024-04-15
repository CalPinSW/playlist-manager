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

## Provisioning VMs with Ansible

VMs can be prepared and configured with Ansible from the `/ansible` directory. To set up managed nodes, set the IP addresses in `ansible-inventory`. Your control node will need to have SSH access to these nodes (this can be done from a mac, or another VM with the repo installed).

You will also need .env.j2 files set up in both the frontend and backend to correctly match the .env.template file. Any variables referenced in .env.j2 files must be defined in an `.ansible-secrets.yml` file next to `.ansible-secrets.template.yml`.

To provision the VMs run `ansible-playbook ansible-playbook.yml -i ansible-inventory` in the `ansible` directory. This will start up the Playlist Manager on the VMs. To stop the application. You can also run `ansible-playbook stop-playlist-manager-playbook.yml -i ansible-inventory`.
