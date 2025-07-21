# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S audiotricks -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=audiotricks:nodejs /app/dist ./dist
COPY --from=build --chown=audiotricks:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=audiotricks:nodejs /app/package*.json ./
COPY --from=build --chown=audiotricks:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p /app/logs && chown audiotricks:nodejs /app/logs

# Switch to non-root user
USER audiotricks

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]