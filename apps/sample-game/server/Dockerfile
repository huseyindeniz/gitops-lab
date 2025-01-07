# Stage 1: Build Stage
FROM node:20-alpine AS builder
ARG BUILD_ENV=
ENV NODE_ENV=${BUILD_ENV}

# Set working directory
WORKDIR /app

# Install all dependencies (dev + prod)
COPY package*.json ./
RUN npm ci

# Copy source code and build the app
COPY . .
RUN npm run build

# Prune dev dependencies to save space
RUN npm prune --production

# Stage 2: Runtime Stage
FROM node:20-alpine AS runtime

ARG BUILD_ENV=
ENV NODE_ENV=${BUILD_ENV}

# Set working directory
WORKDIR /app

# Copy runtime dependencies and the compiled code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/maps ./maps
COPY --from=builder /app/.env.${BUILD_ENV} ./.env.${BUILD_ENV}

# Use a non-root user for security
USER node

# Expose the port your Colyseus app listens on
EXPOSE 2567

# Command to start the application
CMD ["node", "build/index.js"]
