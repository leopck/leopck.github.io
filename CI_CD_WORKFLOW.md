# CI/CD Workflow Guide

## 🚀 **How the CI/CD Works**

### **Architecture Overview**
Your static site uses a proper CI/CD pattern with **separate build and deploy jobs**:

```
Code Push → Build Job → Artifacts → Deploy Job → GitHub Pages
```

### **Workflow 1: `deploy.yml`** (Production Deploy)
**Trigger**: Push to `master` branch

**Job Flow:**
1. **Build Job**:
   - ✅ Checks out code
   - ✅ Sets up Node.js 18 with caching
   - ✅ Installs dependencies (`npm ci`)
   - ✅ Builds site (`npm run build`)
   - ✅ Uploads built files as artifacts

2. **Deploy Job** (only on master branch):
   - ✅ Downloads build artifacts
   - ✅ Deploys to GitHub Pages (`gh-pages` branch)

### **Workflow 2: `ci.yml`** (CI Testing)
**Trigger**: Pull requests to `master`

**Job Flow:**
1. ✅ Checks out code
2. ✅ Sets up Node.js 18 with caching
3. ✅ Installs dependencies
4. ✅ Builds site
5. ✅ Validates output (checks files exist)
6. ✅ Validates post count

## 📁 **Directory Structure**

### **Source** (Your Code)
```
├── generator-enhanced.js    # Static site generator
├── package.json             # Node.js dependencies
├── posts/                   # Markdown source files
├── static-site-generator/   # Templates and assets
└── .github/workflows/       # CI/CD workflows
```

### **Build Output** (GitHub Actions Creates)
```
dist/                       # Built site (GitHub Pages serves this)
├── index.html             # Homepage
├── search.html            # Search page
├── rss.xml               # RSS feed
├── css/                  # Styles
├── js/                   # Scripts
└── esp32/               # Post categories
    └── *.html
```

## 🔧 **GitHub Pages Setup**

### **Step 1: Enable GitHub Pages**
1. Go to your repository settings
2. Navigate to "Pages"
3. Set **Source**: `Deploy from a branch`
4. Set **Branch**: `gh-pages` / `root`
5. Click **Save**

### **Step 2: Push to Master**
```bash
git add .
git commit -m "Add static site generator"
git push origin master
```

### **Step 3: Monitor Deployment**
- Check **Actions** tab for build/deploy status
- Site will be available at: `https://yourusername.github.io/repository-name`

## 📦 **Build Process Details**

### **What `npm run build` Does**
1. **Clean**: Removes old `dist/` directory
2. **Generate**: Runs `generator-enhanced.js`
3. **Output**: Creates `dist/` with all files

### **Generator Enhanced Features**
- ✅ **Markdown to HTML**: Converts all `.md` files
- ✅ **Front Matter**: Parses YAML metadata
- ✅ **Table of Contents**: Auto-generated navigation
- ✅ **Related Posts**: Tag-based suggestions
- ✅ **Search**: Client-side JavaScript search
- ✅ **RSS Feed**: XML feed generation
- ✅ **SEO**: Meta tags and descriptions

### **Generated Files**
```
dist/
├── index.html           # Homepage (6KB)
├── search.html          # Search page (25KB)
├── rss.xml             # RSS feed (12KB)
├── experiments.html    # Post listing (19KB)
├── css/
│   └── style.css      # Styling (18KB)
├── js/
│   └── main.js        # Search (12KB)
└── [category]/
    └── [post].html    # Individual posts
```

## 🧪 **Testing Locally**

### **Quick Test**
```bash
npm install
npm run build
npm run serve
```

### **Development Workflow**
```bash
# 1. Edit your posts in posts/
# 2. Build and test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Update post content"
git push origin master

# 4. GitHub Actions will:
#    - Build the site automatically
#    - Deploy to GitHub Pages
```

## 🔍 **Workflow Monitoring**

### **Check Build Status**
- **Actions Tab**: Shows build progress
- **Artifacts**: Download built files for testing
- **Deploy Logs**: See what files were deployed

### **Common Issues**
1. **Build Fails**: Check Node.js version (should be 18)
2. **Dependencies Missing**: Run `npm install` locally
3. **GitHub Pages Not Updating**: Check branch setting (should be `gh-pages`)

### **Manual Trigger**
```yaml
# You can also trigger manually:
workflow_dispatch:
```

## 📈 **Performance Optimizations**

### **Node.js Caching**
- GitHub Actions caches `npm` packages
- Faster subsequent builds
- Reduces dependency download time

### **Artifact Management**
- Build artifacts uploaded after successful build
- Reused by deploy job (no rebuild needed)
- Reduces deployment time

## 🎯 **Next Steps**

1. **Test Locally**:
   ```bash
   npm install && npm run build
   ```

2. **Enable GitHub Pages** in repository settings

3. **Push to Master** and monitor Actions tab

4. **Visit Your Site** at the GitHub Pages URL

Your static site is now ready with proper CI/CD! 🚀