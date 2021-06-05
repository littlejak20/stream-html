FROM node:14.16.1-alpine AS build
WORKDIR /home/stream-html
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
CMD npm start