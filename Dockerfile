
# Use an official Node.js runtime as the base image
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the working directory
COPY pnpm-lock.yaml package*.json ./

# Install pnpm
RUN npm install -g pnpm

# Copy the entire application code to the working directory
COPY . .

# Install application dependencies
RUN pnpm install

# Build the Hono.js application (if using TypeScript, for example)
# Replace 'npm run build' with your specific build command if needed
RUN pnpm run build:services:payout

# Production stage

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/services/payout/dist ./services/payout/dist
COPY --from=builder /app/services/payout/src/db/migrations ./services/payout/dist/src/db/migrations
COPY --from=builder /app/services/payout/package.json ./services/payout/package.json

# ARG DATABASE_AUTH_TOKEN
ARG DATABASE_URL
# Set production environment
ENV NODE_ENV="staging"
# ENV DATABASE_AUTH_TOKEN=$DATABASE_AUTH_TOKEN
ENV DATABASE_URL=$DATABASE_URL

RUN echo "DB URL $DATABASE_URL"
RUN cat ./services/payout/dist/drizzle.config.js
RUN ls ./services/payout
RUN ls ./services/payout/dist/src/db/
RUN ls ./services/payout/dist/src/db/migrations

RUN npm install -g pnpm

RUN pnpm install

# RUN pnpm run db

# Expose the port your Hono.js application listens on
EXPOSE 9999

# Define the command to run your Hono.js application
# Replace 'npm start' with your specific start command if needed
CMD ["pnpm", "start:services:payout"]
