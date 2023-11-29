# Builder stage
FROM node:20.9-slim as builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies using yarn
RUN yarn install

# Copy source code and configuration files
COPY src/ src/
COPY tsconfig.json ./

# Build the application
RUN yarn run build

# Clean up the yarn cache
RUN yarn cache clean --force

# Server stage
FROM node:20.9-slim as server

WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install production dependencies using yarn
RUN yarn install --prod --non-interactive --ignore-scripts

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set the production environment
ENV NODE_ENV production

# Command to run the production server
CMD ["yarn", "start:prod"]