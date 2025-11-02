#!/bin/bash

# Deploy script for Fridays with Faraday site
# This script builds and optionally deploys the site locally

set -e

echo "🚀 Fridays with Faraday - Site Deploy Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 14 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 14 or later."
    exit 1
fi

print_status "Node.js version: $NODE_VERSION ✓"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Parse command line arguments
DEPLOY=false
SERVE=false
CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --deploy|-d)
            DEPLOY=true
            shift
            ;;
        --serve|-s)
            SERVE=true
            shift
            ;;
        --clean|-c)
            CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --deploy, -d     Deploy to GitHub Pages (requires gh-pages CLI)"
            echo "  --serve, -s      Serve built site locally after build"
            echo "  --clean, -c      Clean build output before building"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Build the site"
            echo "  $0 --clean --serve    # Clean, build, and serve locally"
            echo "  $0 --deploy           # Build and deploy to GitHub Pages"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Clean if requested
if [ "$CLEAN" = true ]; then
    print_status "Cleaning build output..."
    npm run clean
fi

# Build the site
print_status "Building site..."
npm run build

# Verify build
if [ ! -d "static-site-generator/dist" ]; then
    print_error "Build failed: dist directory not found"
    exit 1
fi

if [ ! -f "static-site-generator/dist/index.html" ]; then
    print_error "Build failed: index.html not generated"
    exit 1
fi

print_status "Build completed successfully! ✓"

# Count generated files
FILE_COUNT=$(find static-site-generator/dist -type f | wc -l)
print_status "Generated $FILE_COUNT files"

# Deploy if requested
if [ "$DEPLOY" = true ]; then
    print_status "Deploying to GitHub Pages..."
    
    # Check if gh-pages CLI is installed
    if ! command -v gh-pages &> /dev/null; then
        print_warning "gh-pages CLI not found. Installing..."
        npm install -g gh-pages
    fi
    
    # Deploy
    gh-pages -d static-site-generator/dist -m "Deploy site $(date)"
    
    if [ $? -eq 0 ]; then
        print_status "Deployment successful! ✓"
        print_status "Site should be available at: https://$(git config --get remote.origin.url | sed -n 's#.*github\.com[:/]\([^/]*\)/\([^/]*\).git#\1.github.io/\2#p')/"
    else
        print_error "Deployment failed"
        exit 1
    fi
fi

# Serve if requested
if [ "$SERVE" = true ]; then
    print_status "Starting local server..."
    print_status "Visit http://localhost:3000 to view the site"
    print_status "Press Ctrl+C to stop the server"
    echo ""
    
    # Install http-server if not present
    if ! command -v http-server &> /dev/null; then
        print_status "Installing http-server..."
        npm install -g http-server
    fi
    
    cd static-site-generator/dist
    http-server -p 3000 -o
fi

print_status "Done! 🎉"
