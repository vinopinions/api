# Builder stage
FROM node:20.9-slim as builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm install

# Copy source code and configuration files
COPY src/ src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Clean up the npm cache
RUN npm cache clean --force

# Server stage
FROM node:20.9-slim as server

WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json package-lock.json ./

# Install production dependencies using npm
RUN npm install --prod --non-interactive --ignore-scripts

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set the production environment
ENV NODE_ENV production

# Command to run the production server
CMD ["npm", "run", "start:prod"]