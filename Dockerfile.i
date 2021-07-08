FROM node:16-alpine3.11

# Create app directory
WORKDIR /usr/src/app

COPY . .

# Install app dependencies
COPY package.json .
COPY yarn.lock .

RUN yarn

EXPOSE 8081

CMD [ "yarn", "dev:ingress" ]