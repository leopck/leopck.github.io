#!/bin/bash

# Workflow Verification Script
# This script tests the build process locally to ensure everything works

set -e

echo "🔍 GitHub Actions Workflow Verification"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check required files
echo "Checking required files..."

FILES=(
    ".github/workflows/build.yml"
    "package.json"
    "static-site-generator/package.json"
    "static-site-generator/generator.js"
    "README.md"
    "QUICKSTART.md"
    ".gitignore"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        error "$file missing"
        exit 1
    fi
done

echo ""
echo "Checking directory structure..."

DIRS=(
    "posts/esp32"
    "posts/gaudi"
    "posts/graphics"
    "posts/llm"
    "posts/vllm"
    "posts/experiments"
    "static-site-generator/templates"
    "static-site-generator/assets"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "$dir/ directory exists"
    else
        warning "$dir/ directory missing"
    fi
done

echo ""
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js installed: $NODE_VERSION"
else
    error "Node.js not installed"
    exit 1
fi

echo ""
echo "Installing dependencies..."
cd static-site-generator
if [ ! -d "node_modules" ]; then
    npm install
    success "Dependencies installed"
else
    success "Dependencies already installed"
fi

echo ""
echo "Testing build process..."
npm run build 2>&1 | tee /tmp/build.log

if [ -f "dist/index.html" ]; then
    success "Build completed: index.html generated"
else
    error "Build failed: index.html not found"
    exit 1
fi

echo ""
echo "Checking generated files..."
FILE_COUNT=$(find dist -type f | wc -l)
echo "Generated $FILE_COUNT files"

# List some generated files
echo ""
echo "Sample generated files:"
find dist -type f | head -10 | while read file; do
    echo "  - $file"
done

echo ""
echo "Checking workflow file syntax..."
if grep -q "on:" .github/workflows/build.yml; then
    success "Workflow triggers configured"
else
    error "Workflow triggers not found"
fi

if grep -q "node-version:" .github/workflows/build.yml; then
    success "Node.js version specified"
else
    error "Node.js version not specified"
fi

if grep -q "github_token:" .github/workflows/build.yml; then
    success "GitHub token configured"
else
    error "GitHub token not configured"
fi

echo ""
echo "======================================="
echo "✅ Verification Complete!"
echo "======================================="
echo ""
echo "Summary:"
echo "  - All required files present"
echo "  - Build process working"
echo "  - Generated $FILE_COUNT files"
echo ""
echo "Next steps:"
echo "  1. Push to GitHub repository"
echo "  2. Enable GitHub Pages in repository settings"
echo "  3. Workflow will run automatically"
echo ""
echo "Local testing:"
echo "  npm run build    # Build site"
echo "  npm run serve    # Serve locally"
echo ""

cd ..
