# Docker Deployment for Fridays with Faraday

This directory contains Docker configuration files for containerizing your static site generator.

## Files Overview

- **`Dockerfile`**: Multi-stage Docker build for production deployment
- **`docker-compose.yml`**: Docker Compose configuration for easy development and deployment
- **`nginx.conf`**: Custom Nginx configuration optimized for static sites
- **`docker-build.sh`**: Helper script for building and running containers
- **`.dockerignore`**: Docker ignore file to optimize build performance

## Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
# Build and run the site
./docker-build.sh build-and-run

# View your site at http://localhost:8080

# Stop the container
./docker-build.sh stop

# Clean up everything
./docker-build.sh clean
```

### Option 2: Using Docker Commands

```bash
# Build the Docker image
docker build -t fridays-with-faraday .

# Run the container
docker run -d --name fridays-with-faraday-site -p 8080:80 fridays-with-faraday

# View your site at http://localhost:8080

# Stop the container
docker stop fridays-with-faraday-site
```

### Option 3: Using Docker Compose

```bash
# Build and run with Docker Compose
docker-compose up -d

# View your site at http://localhost:8080

# Stop the containers
docker-compose down
```

## Development Mode

For development with hot reload:

```bash
# Using the helper script
./docker-build.sh dev

# Or using Docker Compose
docker-compose --profile dev up --build
```

This will mount your source files and allow you to see changes immediately without rebuilding the container.

## Build Only Mode

To just build the Docker image without running it:

```bash
# Using the helper script
./docker-build.sh build

# Or using Docker directly
docker build -t fridays-with-faraday .
```

## Architecture

The Docker setup uses a multi-stage build:

1. **Builder Stage**: Uses Node.js 18 Alpine to compile the static site
2. **Production Stage**: Uses Nginx Alpine to serve the static files

This approach ensures:
- Small final image size
- Optimized build process
- Production-ready web server
- Proper caching and compression

## Features

### Production Features
- ✅ Multi-stage build for minimal image size
- ✅ Nginx with optimized configuration
- ✅ Gzip compression enabled
- ✅ Security headers configured
- ✅ Proper MIME types
- ✅ Caching strategies for static assets
- ✅ Health check endpoint

### Development Features
- ✅ Hot reload for development
- ✅ Source file mounting
- ✅ Separate development profile
- ✅ Volume mounting for logs

## Nginx Configuration

The included `nginx.conf` provides:
- **Compression**: Gzip compression for text-based files
- **Caching**: Different cache strategies for different file types
- **Security**: Basic security headers
- **MIME Types**: Proper content type handling
- **Error Pages**: Custom 404 page handling

## Ports

- **Production**: Container exposes port 80, mapped to host port 8080
- **Development**: Container exposes port 3000 for hot reload

## Volumes

- **Development**: Mounts source files for hot reload
- **Logs**: Optional volume mounting for Nginx logs

## Environment Variables

The Docker Compose setup includes optional environment variables:
- `NGINX_HOST`: Server hostname (default: localhost)
- `NGINX_PORT`: Server port (default: 80)

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs fridays-with-faraday-site

# Check if port is already in use
lsof -i :8080
```

### Build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t fridays-with-faraday .
```

### Site not loading
```bash
# Check if container is running
docker ps

# Check Nginx logs inside container
docker exec fridays-with-faraday-site tail -f /var/log/nginx/access.log
docker exec fridays-with-faraday-site tail -f /var/log/nginx/error.log
```

## Customization

### Custom Port
```bash
./docker-build.sh -p 8081 build-and-run
```

### Custom Container Name
```bash
./docker-build.sh -n my-site build-and-run
```

### Custom Image Name
```bash
./docker-build.sh -i my-custom-image build-and-run
```

## CI/CD Integration

The Docker image can be easily integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Build Docker Image
  run: docker build -t fridays-with-faraday .

- name: Test Container
  run: |
    docker run -d -p 8080:80 --name test-container fridays-with-faraday
    sleep 5
    curl -f http://localhost:8080 || exit 1
    docker stop test-container
```

## Production Deployment

For production deployment, consider:
- Using a reverse proxy (like Traefik or Nginx)
- Enabling HTTPS with Let's Encrypt
- Setting up monitoring and logging
- Configuring backups
- Using Docker Swarm or Kubernetes for orchestration