# Build stage
FROM node:18-alpine AS builder

# Install system dependencies needed for build
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install ffmpeg, yt-dlp, gifski, and dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    cargo \
    rust \
    && pip3 install --break-system-packages --no-cache-dir yt-dlp \
    && cargo install gifski \
    && cp /root/.cargo/bin/gifski /usr/local/bin/

# Set environment to production
ENV NODE_ENV=production

# Copy built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create directories for temp files
RUN mkdir -p /app/temp /app/public/gifs

# Expose port
EXPOSE 3000

# Set environment variable for hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
