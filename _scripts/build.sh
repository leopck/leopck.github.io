#!/bin/bash
# Build script for Fridays with Faraday Jekyll site

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
    print_status "docker-compose is available"
}

# Build the Jekyll site
build_site() {
    print_status "Building Jekyll site..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose run --rm jekyll-build
        print_success "Site built successfully with Docker Compose"
    elif command -v bundle >/dev/null 2>&1; then
        bundle exec jekyll build --trace
        print_success "Site built successfully with Bundler"
    else
        print_error "Neither Docker Compose nor Bundler is available"
        exit 1
    fi
}

# Start development server
start_dev_server() {
    print_status "Starting development server..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose up jekyll
        print_success "Development server started (Docker)"
        print_status "Visit http://localhost:4000"
    elif command -v bundle >/dev/null 2>&1; then
        bundle exec jekyll serve --livereload --drafts
        print_success "Development server started (Bundler)"
        print_status "Visit http://localhost:4000"
    else
        print_error "Neither Docker Compose nor Bundler is available"
        exit 1
    fi
}

# Clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts..."
    rm -rf _site/
    rm -rf .jekyll-cache/
    rm -rf .sass-cache/
    print_success "Build artifacts cleaned"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Check HTML validity
    if command -v htmlproofer >/dev/null 2>&1; then
        htmlproofer _site/ --assume-extension --check-html
        print_success "HTML validation passed"
    else
        print_warning "htmlproofer not installed, skipping HTML validation"
    fi
    
    # Check for broken links
    if command -v bundle >/dev/null 2>&1; then
        bundle exec jekyll build --trace
        print_success "Jekyll build successful"
    fi
}

# Deploy to GitHub Pages
deploy_github_pages() {
    print_status "Deploying to GitHub Pages..."
    
    # Check if gh-pages branch exists
    if git show-ref --verify --quiet refs/heads/gh-pages; then
        print_status "Updating gh-pages branch..."
        
        # Checkout gh-pages, copy _site content, and commit
        git checkout gh-pages
        rm -rf *
        cp -r _site/* .
        git add .
        git commit -m "Deploy site: $(date)"
        git push origin gh-pages
        
        # Return to original branch
        git checkout -
        print_success "Deployed to GitHub Pages"
    else
        print_error "gh-pages branch does not exist"
        print_status "Create gh-pages branch and try again"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Fridays with Faraday - Jekyll Site Build Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      Build the Jekyll site"
    echo "  dev        Start development server"
    echo "  clean      Clean build artifacts"
    echo "  test       Run tests"
    echo "  deploy     Deploy to GitHub Pages"
    echo "  help       Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  JEKYLL_ENV    Set to 'production' for production builds"
    echo ""
}

# Main script logic
main() {
    case "${1:-help}" in
        "build")
            check_docker
            check_docker_compose
            build_site
            ;;
        "dev")
            check_docker
            check_docker_compose
            start_dev_server
            ;;
        "clean")
            clean_build
            ;;
        "test")
            run_tests
            ;;
        "deploy")
            check_docker
            deploy_github_pages
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
