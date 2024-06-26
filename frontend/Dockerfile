FROM node:18 AS base

WORKDIR /frontend

COPY package.json .

RUN npm install

COPY src build public tailwind.config.ts ./

EXPOSE 1234

FROM base AS production

ENTRYPOINT ["npm", "run", "prod"]

FROM base AS development

ENTRYPOINT ["npm", "run", "dev"]
