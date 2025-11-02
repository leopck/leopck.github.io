# Workflow Migration: Jekyll → Static Site Generator

## Overview
Your site has been migrated from Jekyll to a custom Node.js-based static site generator. This document explains the changes and how to use the new workflow.

## Key Changes

### 1. **Build Process**
**Before (Jekyll):**
```yaml
- name: Build Jekyll site
  run: docker run --volume="${{ github.workspace }}:/srv/jekyll" jekyll/builder:latest
```

**After (Static Generator):**
```yaml
- name: Build site
  run: node ../generator-enhanced.js
```

### 2. **Source Files**
- **Posts**: Now stored in `posts/` directory (Markdown files)
- **Templates**: Located in `static-site-generator/templates/`
- **Assets**: Located in `static-site-generator/assets/`
- **Generator**: `generator-enhanced.js` (enhanced features)

### 3. **Enhanced Features**
Your new static site generator includes:
- ✅ **Table of Contents**: Auto-generated from headers
- ✅ **Related Posts**: Tag-based content suggestions  
- ✅ **Search**: Client-side search across all posts
- ✅ **RSS Feed**: Auto-generated XML feed
- ✅ **Front Matter**: Metadata support (title, date, tags, etc.)
- ✅ **SEO Optimized**: Meta tags, descriptions, etc.

## GitHub Actions Workflows

### New Workflows Created

#### 1. `deploy.yml`
- **Trigger**: Push to `master` branch
- **Purpose**: Build and deploy to GitHub Pages
- **Output**: Deploys to `gh-pages` branch

#### 2. `ci.yml` (Updated)
- **Trigger**: Pull requests to `master`
- **Purpose**: Validate build and test output
- **Checks**: Post count, required files, build success

### Preserved Workflows
- ✅ `release-drafter.yml`: Release automation
- ✅ `ISSUE_TEMPLATE/`: Bug reports and feature requests

### Removed Workflows
- ❌ `jekyll-latest.yml`: No longer needed
- ❌ `jekyll-3-8-5.yml`: No longer needed
- ❌ `publish-gem.yml`: No longer needed (unless you still need it)

## File Structure

```
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          # NEW: Build & deploy
│   │   └── ci.yml             # UPDATED: CI testing
│   ├── release-drafter.yml    # PRESERVED
│   └── ISSUE_TEMPLATE/        # PRESERVED
├── posts/                     # NEW: Markdown source files
├── generator-enhanced.js      # NEW: Enhanced generator
├── output/                    # NEW: Generated HTML files
└── static-site-generator/     # Templates & assets
    ├── templates/
    └── assets/
```

## Usage

### Local Development
```bash
# Build site locally
npm run build

# Clean and rebuild
npm run build:clean

# Serve locally for testing
npm run serve
```

### GitHub Actions
- **Push to master**: Auto-deploys to GitHub Pages
- **Pull requests**: Runs CI validation
- **Releases**: Release drafter still works

## Migration Benefits

1. **Performance**: Faster builds (no Docker)
2. **Features**: Search, TOC, related posts, RSS
3. **Maintenance**: Simpler Node.js vs Ruby/Docker
4. **Customization**: Full control over output
5. **SEO**: Better meta tags and structure

## Files Generated

Your `output/` directory now contains:
- `index.html` - Homepage
- `search.html` - Search functionality
- `rss.xml` - RSS feed
- `esp32/`, `gaudi/`, `graphics/`, `llm/`, `vllm/`, `experiments/` - Post directories
- All posts as individual HTML files with metadata

## Next Steps

1. **Enable GitHub Pages**: Set source to `gh-pages` branch
2. **Test locally**: Run `npm run build` to verify
3. **Commit changes**: Push new workflows to master
4. **Monitor**: Check Actions tab for successful deployments

Your site is now running on the new static site generator! 🚀