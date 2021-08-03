FROM node:16-alpine3.11

# Create app directory
WORKDIR /usr/src/app

COPY . . 

# Install app dependencies
COPY package.json .
COPY yarn.lock .
# COPY scripts scripts
# COPY packages/worker packages/worker
# COPY packages/utils packages/utils
# COPY combase.config.json combase.config.json

RUN yarn && yarn plugins:build

CMD [ "yarn", "dev:worker" ]