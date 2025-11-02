# CSS Loading Fix for Fridays with Faraday

## ✅ Issues Fixed

### 1. **CSS Files Not Loading**
- **Problem**: CSS and JS files couldn't be found after building and deploying
- **Root Cause**: Hardcoded CSS/JS paths in generator were not using the `basePath` configuration
- **Solution**: Updated generator to use proper basePath-aware CSS/JS references

### 2. **Hidden .github Folder**
- **Problem**: Couldn't access `.github` folder on some systems
- **Solution**: Moved GitHub Actions workflow to visible `workflows/` folder

## 🔧 What Was Changed

### CSS Path Logic (generator-enhanced.js)
Added helper functions to handle basePath correctly:

```javascript
// For root files (index.html, experiments.html, search.html)
function getAssetPath(asset) {
  const prefix = getBasePath();
  return prefix ? `${prefix}/${asset}` : asset;
}

// For subdirectory files (posts in folders)
function getAssetPathForSubdir(asset) {
  const prefix = getBasePath();
  if (prefix) {
    const cleanPrefix = prefix.startsWith('/') ? prefix.slice(1) : prefix;
    return `../${cleanPrefix}/${asset}`;
  }
  return `../${asset}`;
}
```

### CSS References Updated
- **Root files**: `css/style.css` → `${getAssetPath('css/style.css')}`
- **Post files**: `../css/style.css` → `${getAssetPathForSubdir('css/style.css')}`

## 🚀 How to Use

### For GitHub Pages (Root Site)
If your repository is `username.github.io` (served from root):
- Keep `basePath: ''` in generator-enhanced.js
- CSS will load as: `css/style.css`

### For GitHub Pages (Repository Subfolder)
If your repository is served as `username.github.io/repository-name`:
1. Edit `generator-enhanced.js`
2. Change `basePath: ''` to `basePath: '/repository-name'`
3. Rebuild: `node generator-enhanced.js`

### Deployment
1. **GitHub Actions**: Place `workflows/build-and-deploy.yml` in your repository
2. **Manual Build**: Run `node generator-enhanced.js`
3. **Deploy**: Upload `dist/` folder to your web server

## 📁 File Structure in Zip

```
fridays-with-faraday-fixed.zip
├── generator-enhanced.js          # ✅ Fixed CSS loading
├── workflows/
│   └── build-and-deploy.yml       # ✅ Simple GitHub Actions
├── dist/                          # ✅ Generated site with working CSS
├── posts/                         # Your content
├── css/                          # Source CSS
├── js/                           # Source JavaScript
└── ... (other project files)
```

## ✅ Verification

After building, check these files:
- `dist/index.html` should have: `<link rel="stylesheet" href="css/style.css">`
- `dist/experiments/bootloader.html` should have: `<link rel="stylesheet" href="../css/style.css">`

Both CSS files exist in `dist/css/` and `dist/js/` directories.

## 🎯 Next Steps

1. Download and extract `fridays-with-faraday-fixed.zip`
2. For GitHub Pages: Copy `workflows/build-and-deploy.yml` to `.github/workflows/`
3. Push to GitHub and let Actions build and deploy automatically
4. Your CSS should now load correctly!

## 🐛 Troubleshooting

If CSS still doesn't load:
1. Check browser developer tools for 404 errors
2. Verify `dist/css/style.css` exists
3. For subfolder sites, ensure `basePath` matches your repository name
4. Check that your web server is serving from the `dist/` directory

The fixed generator ensures CSS paths work correctly in all deployment scenarios! 🎉
