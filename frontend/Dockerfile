FROM --platform=linux/amd64 node:18 AS base

WORKDIR /frontend

COPY package.json .

RUN npm install

COPY src src
COPY build build
COPY public public
COPY tailwind.config.ts ./

EXPOSE 8080

FROM base AS production

ENTRYPOINT ["npm", "run", "prod"]

FROM base AS development

ENTRYPOINT ["npm", "run", "dev"]
