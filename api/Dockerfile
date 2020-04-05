FROM node:12.16.1-stretch-slim
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn

COPY . .
RUN yarn run build
CMD [ "yarn", "start"]
