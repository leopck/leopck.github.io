# Dockerfile for Fridays with Faraday blog
# Supports both development and production modes

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json ./
RUN npm install

# Development image
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 4321
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image - serve static files with a lightweight server
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
