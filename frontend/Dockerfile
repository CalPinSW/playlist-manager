FROM node:18 AS base

COPY package.json frontend/package.json
WORKDIR /frontend

RUN npm install

COPY src src
COPY build build
COPY public public
COPY tailwind.config.ts .

EXPOSE 1234

FROM base AS production

ENTRYPOINT ["npm", "run", "prod"]

FROM base AS development

ENTRYPOINT ["npm", "run", "dev"]
