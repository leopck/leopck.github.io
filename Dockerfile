# Use Ruby 3.1 or 3.2 with Jekyll 4.x support
FROM ruby:3.2-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies for Jekyll and gems
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy gemfile and install dependencies
COPY Gemfile Gemfile.lock ./

# Install bundler if not available
RUN gem install bundler

# Install Jekyll and dependencies
RUN bundle install --jobs 4 --retry 3

# Copy source code
COPY . .

# Build Jekyll site
RUN bundle exec jekyll build --trace

# Production stage
FROM nginx:alpine

# Copy built site from builder stage
COPY --from=builder /app/_site /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
