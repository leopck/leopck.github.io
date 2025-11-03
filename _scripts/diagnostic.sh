#!/bin/bash
# Test script to diagnose Jekyll build issues step by step

echo "=== JEKYLL BUILD DIAGNOSTIC TOOL ==="
echo

# Step 1: Check Ruby and Bundler versions
echo "Step 1: Checking Ruby/Bundler versions..."
ruby --version
bundler --version
echo

# Step 2: Clean any existing bundles
echo "Step 2: Cleaning existing bundle..."
rm -rf .jekyll-cache .jekyll-metadata vendor/bundle 2>/dev/null || true
echo

# Step 3: Try to resolve gems without installing
echo "Step 3: Testing gem resolution..."
bundle config --local path vendor/bundle
bundle check --gemfile Gemfile.lock
echo

# Step 4: Try bundle install with verbose output
echo "Step 4: Attempting bundle install..."
bundle install --verbose --jobs 1
echo

# Step 5: Test Jekyll build
echo "Step 5: Testing Jekyll build..."
jekyll build --trace
echo

echo "=== DIAGNOSTIC COMPLETE ==="
