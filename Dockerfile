FROM node:14.13.0

# Create app directory
WORKDIR /usr/src/app

COPY packages/worker packages/worker
COPY packages/utils packages/utils

# Install app dependencies
COPY package.json .
COPY yarn.lock .

RUN yarn

EXPOSE 8080

CMD [ "yarn", "start:worker" ]