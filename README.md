# Fridays with Faraday - Static Site

A static site generated from Markdown sources, automatically deployed to GitHub Pages.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the site:**
   ```bash
   npm run build
   ```

3. **Serve locally (optional):**
   ```bash
   npm run serve
   ```
   Visit http://localhost:3000 to view the site

4. **Development mode:**
   ```bash
   npm run dev
   ```

### Project Structure

```
├── posts/                  # Markdown source files
│   ├── esp32/
│   ├── gaudi/
│   ├── graphics/
│   ├── llm/
│   └── vllm/
├── static-site-generator/  # Site generator
│   ├── generator.js       # Main generator script
│   ├── templates/         # HTML templates
│   ├── assets/           # CSS/JS files
│   └── dist/             # Generated site (auto-generated)
├── .github/workflows/     # GitHub Actions
└── docs/                  # Documentation
```

## 📝 Adding Content

### Create a New Post

1. **Add markdown file** to the appropriate category in `posts/`:
   - `posts/esp32/` - ESP32 microcontroller content
   - `posts/gaudi/` - Intel Gaudi AI accelerator content
   - `posts/graphics/` - Graphics programming content
   - `posts/llm/` - Large Language Model content
   - `posts/vllm/` - vLLM content
   - `posts/experiments/` - General experiments

2. **Markdown format**:
   ```markdown
   # Your Post Title

   Brief description of your post content...

   ## Section 1

   Your content here with **bold text**, `inline code`, and:
   
   - Lists
   - Links: [Example](https://example.com)
   - Code blocks:
   
   ```bash
   # Terminal commands
   ls -la
   ```

   Thank you for reading! [← Back to Experiments]({{basePath}}/experiments.html)
   ```

3. **Rebuild site**:
   ```bash
   npm run build
   ```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Generate site from Markdown sources |
| `npm run dev` | Build in development mode |
| `npm run clean` | Clean build output |
| `npm run build:clean` | Clean and rebuild |
| `npm run serve` | Serve built site locally |
| `npm test` | Run tests |

## 🚀 GitHub Pages Deployment

### Automatic Deployment

The site automatically builds and deploys when you push to `main` or `master` branch:

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **GitHub Actions** will:
   - ✅ Checkout code
   - ✅ Install Node.js and dependencies
   - ✅ Build the site from Markdown
   - ✅ Deploy to GitHub Pages
   - ✅ Upload build artifacts

3. **Deployment URL:**
   - `https://yourusername.github.io/repository-name/`
   - Or custom domain if configured

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to gh-pages branch (requires gh-pages package)
npx gh-pages -d static-site-generator/dist
```

## ⚙️ Configuration

### GitHub Pages Setup

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `/(root)`

2. **Custom Domain (optional):**
   - Add `CNAME` file to repository root
   - Configure DNS with your domain provider
   - Add `CNAME` secret to repository settings

### Build Configuration

Edit `static-site-generator/generator.js` to customize:

- **Categories:** Modify the `categories` array
- **Templates:** Update files in `templates/` directory
- **Styling:** Edit `assets/css/style.css`
- **Navigation:** Modify `createNavigation()` function

### Workflow Customization

Edit `.github/workflows/build.yml` to:
- Change trigger branches
- Modify Node.js version
- Add post-build steps
- Configure notifications

## 🐛 Troubleshooting

### Build Fails

1. **Check Node.js version:**
   ```bash
   node --version  # Should be >= 14.0.0
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

3. **Check file paths:**
   - Verify `posts/` directory exists
   - Ensure markdown files are in correct categories

### Deployment Issues

1. **Verify GitHub Pages settings:**
   - Repository Settings → Pages
   - Source branch: `gh-pages`
   - No HTTPS blocking

2. **Check workflow logs:**
   - Go to Actions tab in repository
   - Click on failed workflow run
   - Review error messages

3. **Permissions issue:**
   - Repository Settings → Actions → General
   - Workflow permissions: Read and write

## 📦 Dependencies

- **Node.js 14+** - Runtime environment
- **No external npm packages** - Uses built-in Node.js modules
- **GitHub Actions** - Automated deployment

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test: `npm run build`
4. Commit changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check GitHub Actions logs for build issues
- Review generator.js for customization options
- Open issue for bugs or feature requests

---

**Built with ❤️ using static site generator and GitHub Pages**
