FROM node:18

COPY package.json frontend/package.json
WORKDIR /frontend

RUN npm install

COPY src src
COPY build build
COPY public public
COPY tailwind.config.ts .

EXPOSE 1234

CMD ["npm", "run", "dev"]
