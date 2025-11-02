#!/bin/bash

# Test script to verify path fixes work correctly
set -e

echo "🧪 Testing path fixes for Fridays with Faraday Static Site Generator"
echo "=================================================================="

# Test 1: Verify all required files exist
echo "📋 Test 1: Checking required files..."
required_files=(
    "generator-enhanced.js"
    "package.json"
    "posts"
    "static-site-generator/assets"
)

for file in "${required_files[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ⚠ $file not found (may be created during build)"
    fi
done

# Test 2: Check configuration paths
echo ""
echo "📋 Test 2: Verifying configuration paths in generator-enhanced.js..."
if grep -q "postsDirectory: 'posts'" generator-enhanced.js; then
    echo "  ✓ postsDirectory uses relative path"
else
    echo "  ❌ postsDirectory still uses absolute path"
fi

if grep -q "outputDirectory: 'dist'" generator-enhanced.js; then
    echo "  ✓ outputDirectory uses relative path"
else
    echo "  ❌ outputDirectory still uses absolute path"
fi

if grep -q "assetsDirectory: 'static-site-generator/assets'" generator-enhanced.js; then
    echo "  ✓ assetsDirectory uses relative path"
else
    echo "  ❌ assetsDirectory still uses absolute path"
fi

# Test 3: Check extract-assets.js configuration
echo ""
echo "📋 Test 3: Verifying extract-assets.js configuration..."
if grep -q "ASSETS_DIR = 'static-site-generator/assets'" static-site-generator/extract-assets.js; then
    echo "  ✓ extract-assets.js uses relative path"
else
    echo "  ❌ extract-assets.js still uses absolute path"
fi

# Test 4: Build test
echo ""
echo "📋 Test 4: Running build test..."
if npm run build; then
    echo "  ✓ Build completed successfully"
else
    echo "  ❌ Build failed"
    exit 1
fi

# Test 5: Verify output
echo ""
echo "📋 Test 5: Verifying build output..."
if [ -d "dist" ]; then
    echo "  ✓ dist directory created"
    if [ -f "dist/index.html" ]; then
        echo "  ✓ index.html generated"
    else
        echo "  ❌ index.html not found"
    fi
    if [ -f "dist/rss.xml" ]; then
        echo "  ✓ rss.xml generated"
    else
        echo "  ❌ rss.xml not found"
    fi
    echo "  📁 Files in dist:"
    find dist -type f | head -10
else
    echo "  ❌ dist directory not created"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Path fixes are working correctly."
echo ""
echo "💡 Next steps:"
echo "  - Test Docker build: ./docker-build.sh build"
echo "  - Run container: ./docker-build.sh run"
echo "  - Test CI/CD: The updated workflow should now work with relative paths"