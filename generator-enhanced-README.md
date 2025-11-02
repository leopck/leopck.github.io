# Static Site Generator Enhanced

## Overview
`generator-enhanced.js` is a powerful Node.js-based static site generator that converts Markdown files to HTML with advanced features.

## Features

### Core Functionality
- 📝 **Markdown to HTML**: Converts all `.md` files in `posts/` to HTML
- 🎨 **Template System**: Uses HTML templates with dynamic content insertion
- 📁 **Asset Management**: Copies CSS, JS, and other assets automatically

### Enhanced Features
- 🔍 **Table of Contents**: Auto-generates navigation from headers
- 🔗 **Related Posts**: Suggests posts based on shared tags
- 🔎 **Search**: Client-side JavaScript search across all posts
- 📡 **RSS Feed**: Auto-generates XML feed for blog subscriptions
- 📊 **Metadata**: Parses YAML front matter (title, date, tags, etc.)
- 🏷️ **Tag System**: Categorizes and organizes posts

## Usage

### Basic Usage
```bash
node generator-enhanced.js
```

### Package Scripts
```bash
npm run build    # Generate site
npm run clean    # Clean output directory
npm run serve    # Preview site locally
```

## File Structure

### Input
```
posts/                    # Source Markdown files
├── esp32/               # ESP32 microcontroller posts
├── gaudi/               # Graphics programming
├── graphics/            # Graphics techniques
├── llm/                 # Large Language Models
├── vllm/                # VLLM optimization
└── experiments/         # Technical experiments
```

### Output
```
output/                   # Generated HTML files
├── index.html           # Homepage
├── search.html          # Search page
├── rss.xml              # RSS feed
├── esp32/               # ESP32 posts
├── gaudi/               # Gaudi posts
├── graphics/            # Graphics posts
├── llm/                 # LLM posts
├── vllm/                # VLLM posts
└── experiments/         # Experiment posts
```

## Configuration

### Generator Settings
```javascript
const CONFIG = {
  postsDirectory: 'posts',
  outputDirectory: 'output',
  templatesDirectory: 'static-site-generator/templates',
  assetsDirectory: 'static-site-generator/assets',
  basePath: '',  // Set to '/repository-name' for GitHub Pages subpaths
};
```

### Post Metadata (Front Matter)
```markdown
---
title: "Your Post Title"
date: "2023-12-01"
tags: ["esp32", "microcontrollers", "iot"]
difficulty: "intermediate"
description: "Brief description for SEO"
---

Your Markdown content here...
```

## Template System

### Base Template (`templates/base.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <meta name="description" content="{{description}}">
</head>
<body>
    <nav>{{navigation}}</nav>
    <main>{{content}}</main>
    <footer>{{footer}}</footer>
</body>
</html>
```

### Template Variables
- `{{title}}` - Post or page title
- `{{description}}` - Meta description
- `{{navigation}}` - Site navigation
- `{{content}}` - Main content (HTML from Markdown)
- `{{footer}}` - Site footer
- `{{basePath}}` - Base path for GitHub Pages

## Generated Features

### Table of Contents
```html
<nav class="toc">
    <h2>Table of Contents</h2>
    <ul>
        <li><a href="#header-1">Header 1</a></li>
        <li><a href="#header-2">Header 2</a></li>
    </ul>
</nav>
```

### Related Posts
```html
<div class="related-posts">
    <h3>Related Posts</h3>
    <ul>
        <li><a href="post.html">Related Post 1</a></li>
        <li><a href="post2.html">Related Post 2</a></li>
    </ul>
</div>
```

### Search Functionality
- Client-side JavaScript search
- Searches titles, content, and tags
- Instant results with keyword highlighting

### RSS Feed
- XML format for blog subscriptions
- Includes title, description, date, and link
- Valid RSS 2.0 specification

## Error Handling

The generator includes robust error handling:
- ✅ Null checks in utility functions
- ✅ Graceful handling of missing files
- ✅ Validation of post metadata
- ✅ Fallback templates for errors

## GitHub Actions Integration

### Deployment Workflow
1. **Checkout**: Fetches repository code
2. **Node.js Setup**: Configures Node.js 18
3. **Install Dependencies**: Runs npm install
4. **Build Site**: Executes generator-enhanced.js
5. **Deploy**: Pushes output to gh-pages branch

### CI Validation
- Validates build success
- Checks for required files (index.html, rss.xml)
- Verifies post count threshold
- Tests output directory structure

## Dependencies

```json
{
  "js-yaml": "^4.1.0"
}
```

## Node.js Requirements
- Node.js >= 14.0.0
- No Ruby or Docker required (unlike Jekyll)

## Troubleshooting

### Common Issues

1. **Missing Posts**
   - Check `posts/` directory structure
   - Verify Markdown files have `.md` extension

2. **Template Errors**
   - Ensure templates exist in `templates/` directory
   - Check template syntax (curly braces `{{}}`)

3. **Build Failures**
   - Run with verbose logging
   - Check JavaScript console for errors
   - Verify all dependencies are installed

### Debug Mode
```bash
node generator-enhanced.js --debug
```

## Performance

- **Build Time**: ~2-5 seconds for 20+ posts
- **Output Size**: ~1-2MB for complete site
- **Memory Usage**: ~50-100MB during build

## Examples

### Creating a New Post
1. Create new `.md` file in appropriate category
2. Add front matter with metadata
3. Write content in Markdown
4. Run `npm run build`
5. Commit and push (GitHub Actions auto-deploys)

### Customizing Templates
1. Edit `templates/base.html`
2. Add new template variables
3. Update generator logic if needed
4. Test changes locally before deploying

Your enhanced static site generator is ready to use! 🚀