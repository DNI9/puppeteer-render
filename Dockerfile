# Use a slim Node.js image as a base
FROM node:21-alpine AS builder

# Install dependencies for building the application
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy the application code
COPY . .

# Build the final image with Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.10.0

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copy the built application from the builder stage
COPY --from=builder /app /usr/src/app

# Working directory for the application
WORKDIR /usr/src/app

# Start the application
CMD [ "node", "index.js" ]
