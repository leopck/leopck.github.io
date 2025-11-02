#!/bin/bash

# Docker build and run script for Fridays with Faraday Static Site Generator
# This script simplifies the Docker build and deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="fridays-with-faraday"
CONTAINER_NAME="fridays-with-faraday-site"
PORT=8080
ACTION="build-and-run"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Docker Build Script for Fridays with Faraday Static Site Generator"
    echo ""
    echo "Usage: $0 [OPTIONS] [ACTION]"
    echo ""
    echo "Actions:"
    echo "  build-and-run    Build the image and run the container (default)"
    echo "  build           Only build the Docker image"
    echo "  run             Run existing container"
    echo "  stop            Stop running container"
    echo "  clean           Remove container and image"
    echo "  dev             Run in development mode with hot reload"
    echo "  help            Show this help message"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT     Port to serve the site (default: 8080)"
    echo "  -n, --name NAME     Container name (default: fridays-with-faraday-site)"
    echo "  -i, --image NAME    Image name (default: fridays-with-faraday)"
    echo ""
    echo "Examples:"
    echo "  $0 build-and-run                    # Build and run on port 8080"
    echo "  $0 -p 8080 build-and-run           # Build and run on custom port"
    echo "  $0 build                            # Only build the image"
    echo "  $0 dev                             # Run in development mode"
    echo "  $0 clean                           # Clean up container and image"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -n|--name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -i|--image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        build-and-run|build|run|stop|clean|dev|help)
            ACTION="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

# Execute the requested action
case $ACTION in
    help)
        show_help
        exit 0
        ;;
    build)
        print_status "Building Docker image: $IMAGE_NAME"
        docker build -t "$IMAGE_NAME" .
        print_status "Build completed successfully!"
        ;;
    run)
        print_status "Running container: $CONTAINER_NAME"
        docker run -d --name "$CONTAINER_NAME" -p "$PORT:80" "$IMAGE_NAME"
        print_status "Container started on port $PORT"
        print_status "Access your site at: http://localhost:$PORT"
        ;;
    build-and-run)
        print_status "Building Docker image: $IMAGE_NAME"
        docker build -t "$IMAGE_NAME" .
        
        # Stop and remove existing container if it exists
        if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_status "Removing existing container: $CONTAINER_NAME"
            docker rm -f "$CONTAINER_NAME"
        fi
        
        print_status "Starting container: $CONTAINER_NAME"
        docker run -d --name "$CONTAINER_NAME" -p "$PORT:80" "$IMAGE_NAME"
        print_status "Build and deployment completed successfully!"
        print_status "Access your site at: http://localhost:$PORT"
        ;;
    stop)
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_status "Stopping container: $CONTAINER_NAME"
            docker stop "$CONTAINER_NAME"
            print_status "Container stopped successfully!"
        else
            print_warning "Container '$CONTAINER_NAME' is not running"
        fi
        ;;
    clean)
        print_status "Cleaning up Docker resources..."
        
        # Stop and remove container
        if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            docker rm -f "$CONTAINER_NAME"
            print_status "Removed container: $CONTAINER_NAME"
        fi
        
        # Remove image
        if docker images --format '{{.Repository}}' | grep -q "^${IMAGE_NAME}$"; then
            docker rmi "$IMAGE_NAME"
            print_status "Removed image: $IMAGE_NAME"
        fi
        
        print_status "Cleanup completed!"
        ;;
    dev)
        print_status "Starting development mode with hot reload..."
        docker-compose --profile dev up --build
        ;;
    *)
        print_error "Unknown action: $ACTION"
        show_help
        exit 1
        ;;
esac