ARG NODE_VERSION=20.11.0
ARG FIREBASE_VERSION=13.7.1

FROM node:${NODE_VERSION}-alpine

RUN npm i -g firebase-tools@$FIREBASE_VERSION

RUN firebase setup:emulators:ui

COPY ../.firebaserc ../firebase.json ./

ENTRYPOINT ["firebase", "emulators:start"]