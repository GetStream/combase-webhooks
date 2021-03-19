FROM node:15.12.0-alpine3.10

# Create app directory
WORKDIR /usr/src/app

COPY . .

# Install app dependencies
COPY package.json .
COPY yarn.lock .

RUN yarn

CMD [ "yarn", "start:worker" ]