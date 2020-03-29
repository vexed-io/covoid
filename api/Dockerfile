FROM node:12.16.1-stretch-slim
WORKDIR /usr/src/app

COPY . .
RUN yarn
RUN yarn run build
CMD [ "yarn", "start"]
