# WebSocket Service Dockerfile
FROM oven/bun:1-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy WebSocket service files
COPY mini-services/gomoku-service/package.json ./
COPY mini-services/gomoku-service/bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY mini-services/gomoku-service/index.ts ./

# Expose port
EXPOSE 3003

# Environment
ENV NODE_ENV=production

# Start the WebSocket server
CMD ["bun", "index.ts"]
