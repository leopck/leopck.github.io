# GitHub Pages Configuration
# This file documents the GitHub Pages setup for the repository

# Repository Settings Required:
# 1. Go to repository Settings → Pages
# 2. Source: Deploy from a branch
# 3. Branch: gh-pages / /(root)
# 4. Folder: / (root)

# Environment Variables/Secrets (Optional):
# 1. CNAME: Set your custom domain if using one
# 2. No other secrets required - GITHUB_TOKEN is automatic

# Workflow Details:
# - Workflow file: .github/workflows/build.yml
# - Triggers: Push to main/master branches
# - Node.js version: 18
# - Deployment branch: gh-pages
# - Build command: npm run build

# DNS Configuration (if using custom domain):
# Add these DNS records with your domain provider:
# 
# CNAME Record:
# Name: www
# Value: yourusername.github.io
# TTL: 3600
# 
# A Records (for apex domain):
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

# URL Structure:
# - Repository name: https://yourusername.github.io/repository-name/
# - Custom domain: https://yourdomain.com/
# - Individual posts: https://yourdomain.com/category/post-name.html

# Troubleshooting:
# - Check Actions tab for workflow status
# - Ensure gh-pages branch is created
# - Verify Pages settings are correct
# - Check DNS propagation (can take 24-48 hours)
