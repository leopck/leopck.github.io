# Multi-stage Dockerfile for Fridays with Faraday Static Site Generator

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy generator and posts
COPY generator-enhanced.js ./
COPY posts/ ./posts/

# Build the static site
RUN npm run build

# Stage 2: Production stage with nginx to serve static files
FROM nginx:alpine

# Copy built static files from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy custom nginx configuration (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]