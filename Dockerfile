FROM node:22.15.0-alpine3.21

WORKDIR /src

COPY package*.json .

RUN npm install --omit=dev

COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]