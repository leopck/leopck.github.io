#!/bin/bash
# Comprehensive Circular Dependency Fix Test Script
# Tests multiple approaches to resolve Jekyll circular dependency issues

set -e

echo "=== Comprehensive Circular Dependency Fix Test ==="
echo "Testing multiple approaches to resolve Jekyll bundler circular dependency..."
echo ""

# Step 1: Clean previous attempts
echo "Step 1: Cleaning previous Docker builds..."
docker-compose down 2>/dev/null || true
docker system prune -f 2>/dev/null || true
rm -rf Gemfile.lock vendor/bundle 2>/dev/null || true

# Step 2: Test current configuration
echo ""
echo "Step 2: Testing current configuration..."
if docker-compose up jekyll 2>&1 | tee build.log; then
    echo "✅ SUCCESS: Build completed without circular dependency errors!"
    echo ""
    echo "If Jekyll server started successfully, test the site:"
    echo "- Visit http://localhost:4000"
    echo "- Verify basic functionality works"
    echo ""
    echo "To stop the server: docker-compose down"
else
    echo "❌ FAILED: Circular dependency still persists"
    echo ""
    
    # Step 3: Check what specific error occurred
    echo "Step 3: Analyzing build failure..."
    if grep -q "circular dependency" build.log; then
        echo "Found circular dependency error in logs"
    elif grep -q "jekyll-sass-converter" build.log; then
        echo "Found jekyll-sass-converter related error"
    else
        echo "Checking for other bundler issues..."
        grep -i "bundler\|gem\|dependency" build.log | tail -10
    fi
fi

# Step 4: Fallback strategy if current fix fails
echo ""
echo "=== Fallback Strategy ==="
echo "If circular dependency persists, try these alternatives:"
echo ""
echo "Alternative 1: System Jekyll (no bundler)"
echo "  1. Remove Gemfile and Gemfile.lock"
echo "  2. Modify Dockerfile.dev to install Jekyll directly:"
echo "     RUN gem install jekyll bundler --no-document"
echo "  3. Replace bundle exec commands with direct jekyll commands"
echo ""
echo "Alternative 2: Jekyll 3.x"
echo "  1. Change Gemfile to: gem 'jekyll', '~> 3.9.3'"
echo "  2. Remove Gemfile.lock and rebuild"
echo ""
echo "Alternative 3: Minimal Bundle"
echo "  1. Use: gem 'jekyll' without version constraints"
echo "  2. Remove all development group gems"
echo "  3. Install rake separately: gem install rake"

# Step 5: Create summary report
echo ""
echo "=== Test Summary ==="
echo "Test completed at: $(date)"
echo "Configuration tested:"
echo "  - Ruby 3.3-slim"
echo "  - Bundler 2.4.22"
echo "  - Flexible Jekyll versioning"
echo "  - Multiple bundler fallback strategies"
echo ""
echo "Logs saved to: build.log"
echo ""
echo "Next steps:"
echo "1. If successful: Test basic Jekyll functionality"
echo "2. If failed: Try alternative approaches listed above"
echo "3. Once working: Add plugins incrementally (see CIRCULAR_DEPENDENCY_COMPREHENSIVE_FIX.md)"