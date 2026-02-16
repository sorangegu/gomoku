# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build the Next.js application
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set database URL
ENV DATABASE_URL=file:/app/data/gomoku.db

# Start command - start server directly (SQLite auto-creates)
CMD ["bun", "server.js"]
