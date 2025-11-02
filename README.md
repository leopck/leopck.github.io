# Fridays with Faraday - Jekyll Static Site

A modern, responsive Jekyll static site for the "Fridays with Faraday" technical blog, covering ESP32 microcontroller programming, AI accelerator optimization, and performance analysis.

## 🚀 Features

- **Modern Jekyll 4.x** implementation with essential plugins
- **Responsive Design** optimized for all devices
- **Technical Content Focus** with code highlighting, math rendering, and diagrams
- **SEO Optimized** with structured data, Open Graph, and social sharing
- **Fast Performance** with optimized assets and caching
- **Docker Development** environment for consistent builds
- **GitHub Pages Ready** deployment configuration
- **Advanced Typography** with beautiful code blocks and reading experience

## 📁 Project Structure

```
jekyll-site/
├── _layouts/              # Jekyll layouts
│   ├── default.html       # Base layout
│   ├── post.html          # Blog post layout
│   └── page.html          # Static page layout
├── _includes/             # Reusable components
│   ├── navigation.html    # Main navigation
│   ├── footer.html        # Site footer
│   ├── post-meta.html     # Post metadata
│   └── toc.html           # Table of contents
├── _posts/                # Blog posts in Jekyll format
├── _sass/                 # SCSS stylesheets
│   ├── _variables.scss    # Sass variables
│   ├── _mixins.scss       # Sass mixins
│   ├── _typography.scss   # Typography styles
│   ├── _base.scss         # Base styles
│   └── _layout.scss       # Layout components
├── _assets/               # JavaScript and other assets
│   └── js/
│       └── main.js        # Main JavaScript functionality
├── css/                   # Compiled CSS
│   └── style.scss         # Main stylesheet entry point
├── docker/                # Docker configuration
│   └── nginx.conf         # Nginx configuration
├── _scripts/              # Utility scripts
│   ├── build.sh           # Build automation script
│   ├── convert_posts.py   # Content conversion script
│   └── convert_posts.rb   # Ruby version of converter
├── _config.yml            # Jekyll configuration
├── Gemfile                # Ruby dependencies
├── docker-compose.yml     # Docker development setup
├── Dockerfile             # Production container
└── Dockerfile.dev         # Development container
```

## 🛠️ Development

### Prerequisites

- **Docker & Docker Compose** (recommended for development)
- **Ruby 3.2+** and **Bundler** (alternative to Docker)
- **Node.js 18+** (for optional JavaScript tooling)

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd jekyll-site
   ```

2. **Development with Docker:**
   ```bash
   # Start development server
   docker-compose up jekyll
   
   # Or run full development environment
   docker-compose up
   ```

3. **Access the site:**
   ```
   http://localhost:4000
   ```

### Alternative: Native Development

1. **Install dependencies:**
   ```bash
   bundle install
   ```

2. **Start development server:**
   ```bash
   bundle exec jekyll serve --livereload --drafts
   ```

3. **Build for production:**
   ```bash
   bundle exec jekyll build
   ```

### Using Build Scripts

The project includes automated build scripts:

```bash
# Make scripts executable
chmod +x _scripts/build.sh

# Build the site
./_scripts/build.sh build

# Start development server
./_scripts/build.sh dev

# Clean build artifacts
./_scripts/build.sh clean

# Run tests
./_scripts/build.sh test

# Deploy to GitHub Pages
./_scripts/build.sh deploy
```

## 📝 Content Management

### Post Organization

All blog posts are stored in the `_posts/` directory with Jekyll naming convention:
- Format: `YYYY-MM-DD-title.md`
- Categories: esp32, experiments, gaudi, graphics, llm, vllm
- Front matter includes: title, date, category, tags, description, difficulty

### Content Conversion

Existing posts have been automatically converted from Node.js format to Jekyll:

```bash
# Convert additional posts if needed
python _scripts/convert_posts.py /path/to/old/posts /path/to/jekyll/posts
```

### Front Matter Structure

```yaml
---
title: "Post Title"
author: "Fridays with Faraday"
category: "esp32"
tags: [microcontroller, dma, embedded, performance]
description: "Technical analysis and implementation guide"
difficulty: intermediate
layout: post
toc: true
show_related_posts: true
show_share_buttons: true
reading_time: 5
---
```

## 🎨 Styling & Design

### SCSS Architecture

The project uses a modular SCSS architecture:

- **Variables** (`_variables.scss`): Colors, typography, spacing
- **Mixins** (`_mixins.scss`): Reusable CSS patterns
- **Typography** (`_typography.scss`): Text styling and code blocks
- **Base** (`_base.scss`): Reset and foundation styles
- **Layout** (`_layout.scss`): Component layouts

### Design System

- **Primary Color**: #007acc (Blue)
- **Secondary Color**: #ff6b35 (Orange)
- **Typography**: Inter + JetBrains Mono
- **Categories**: Color-coded by technology (ESP32, LLM, etc.)
- **Responsive**: Mobile-first approach with breakpoints

### Category Colors

- **ESP32**: #007acc (Blue)
- **Experiments**: #ff6b35 (Orange)  
- **Gaudi**: #8b5cf6 (Purple)
- **Graphics**: #06d6a0 (Green)
- **LLM**: #f72585 (Pink)
- **vLLM**: #fb8c00 (Orange)

## 🔧 Configuration

### Jekyll Configuration

The main configuration is in `_config.yml`:

```yaml
# Site settings
title: "Fridays with Faraday"
description: "Technical blog on embedded systems and optimization"
url: "https://fridayswithfaraday.github.io"

# Collections for categories
collections:
  esp32:
    output: true
    permalink: /esp32/:title/
  # ... other categories

# Plugins
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-archives
  - jekyll-related-posts
  - jekyll-katex
  - jekyll-toc
  - jekyll-paginate
```

### Environment Variables

- `JEKYLL_ENV=production` - Enable production optimizations
- `JEKYLL_ENV=development` - Enable development features (live reload, drafts)

## 🚀 Deployment

### GitHub Pages

The site is configured for GitHub Pages deployment:

1. **Enable GitHub Pages** in repository settings
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `master`, folder: `/ (root)`
4. **Custom domain** (optional): Configure in repository settings

### Docker Production Deployment

```bash
# Build and run production container
docker-compose up -d web
```

### Manual Deployment

```bash
# Build site
bundle exec jekyll build

# Deploy _site/ directory to your web server
```

## 📊 Features

### Built-in Functionality

- ✅ **Responsive Navigation** with mobile menu
- ✅ **Table of Contents** auto-generation
- ✅ **Related Posts** algorithm based on tags/categories
- ✅ **Social Sharing** buttons with OpenGraph
- ✅ **Search Integration** (Lunr.js ready)
- ✅ **RSS Feed** generation
- ✅ **Sitemap** auto-generation
- ✅ **SEO Optimization** with structured data
- ✅ **Performance Optimized** with asset pipeline
- ✅ **Code Highlighting** with syntax highlighting
- ✅ **Math Rendering** with KaTeX support

### Advanced Features

- ✅ **Reading Time** estimation
- ✅ **Related Posts** with category/tag matching
- ✅ **Breadcrumb Navigation**
- ✅ **Author Profiles** and social links
- ✅ **Tag Clouds** and category pages
- ✅ **Archive Pages** by year and category
- ✅ **404 Error Page**
- ✅ **Favicon and OpenGraph** images
- ✅ **Dark Mode** ready (theme toggle available)

## 🧪 Testing

The site includes automated testing:

```bash
# Run all tests
./_scripts/build.sh test

# HTML validation with htmlproofer
htmlproofer _site/ --assume-extension --check-html

# Build verification
bundle exec jekyll build --trace
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Content Guidelines

- Use clear, descriptive titles
- Include proper front matter
- Add relevant tags and categories
- Ensure technical accuracy
- Follow existing writing style

### Code Guidelines

- Follow existing SCSS structure
- Test responsive design
- Optimize for performance
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Jekyll** community for the excellent static site generator
- **GitHub Pages** for hosting and deployment
- **Open source contributors** whose work inspired this project
- **ESP32 community** for inspiration and examples

## 📞 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the `_docs/` directory for additional guides
- **Community**: Join our discussions for questions and help

---

**Built with ❤️ using Jekyll and modern web technologies**

*Fridays with Faraday - Working with microcontrollers, embedded systems, and performance optimization*
