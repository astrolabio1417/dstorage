FROM node:22.15.0-alpine3.21

WORKDIR /src

COPY package*.json .

RUN npm install

COPY . .

CMD [ "npm", "run", "dev" ]