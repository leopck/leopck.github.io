# Quick Start Guide

## 🚀 Setup GitHub Actions Workflow

Follow these steps to enable automated builds and deployment:

### 1. Repository Setup

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow for automated deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click `Settings` → `Pages`
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `/(root)`
   - Click `Save`

### 2. First Deployment

The workflow will automatically run on your next push. To trigger it:

```bash
# Make a small change
echo "# Test" > test.md

# Commit and push
git add test.md
git commit -m "Trigger first deployment"
git push origin main
```

### 3. Verify Deployment

1. **Check Actions Tab:**
   - Go to `Actions` tab in your repository
   - You should see the workflow running
   - Wait for it to complete (green checkmark)

2. **Visit Your Site:**
   - URL: `https://yourusername.github.io/repository-name/`
   - Replace `yourusername` and `repository-name` with your actual values

### 4. Custom Domain (Optional)

If you want to use a custom domain:

1. **Create CNAME file:**
   ```bash
   cp CNAME.template CNAME
   # Edit CNAME and add your domain
   ```

2. **Configure DNS:**
   Add these records with your domain provider:
   ```
   CNAME: www.yourdomain.com → yourusername.github.io
   
   A Records:
   185.199.108.153
   185.199.110.153
   185.199.109.153
   185.199.111.153
   ```

3. **Update GitHub Pages Settings:**
   - Settings → Pages
   - Custom domain: `yourdomain.com`
   - Check "Enforce HTTPS"

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Build the site
npm run build

# Serve locally
npm run serve
```

## 📁 Project Structure

```
├── .github/workflows/build.yml    # GitHub Actions workflow
├── posts/                         # Markdown source files
├── static-site-generator/         # Site generator
│   ├── generator.js              # Main generator
│   ├── templates/                # HTML templates
│   └── dist/                     # Generated site
├── package.json                  # Root package config
├── deploy.sh                     # Deployment script
└── README.md                     # Full documentation
```

## ✅ Verification Checklist

- [ ] GitHub Actions workflow created (`.github/workflows/build.yml`)
- [ ] Workflow triggers on push to main/master
- [ ] Site builds successfully (check Actions logs)
- [ ] GitHub Pages enabled and pointing to `gh-pages` branch
- [ ] Site loads at `https://username.github.io/repository-name/`
- [ ] Local build works (`npm run build`)
- [ ] README.md contains setup instructions

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version: `node --version` (need 14+)
- Clear cache: `rm -rf node_modules && npm install`
- Check Actions logs for specific errors

### Site Not Loading
- Verify GitHub Pages settings
- Check `gh-pages` branch exists
- Ensure HTTPS is enabled
- Wait 5-10 minutes for deployment

### Workflow Not Running
- Confirm workflow file is in `.github/workflows/`
- Check repository Settings → Actions are enabled
- Verify you're pushing to `main` or `master` branch

## 📝 Next Steps

1. **Add Content:**
   - Create markdown files in `posts/` directory
   - Follow existing structure and naming conventions
   - Push changes to trigger automatic rebuild

2. **Customize Site:**
   - Edit templates in `static-site-generator/templates/`
   - Modify CSS in `static-site-generator/assets/css/`
   - Update navigation in `generator.js`

3. **Monitor:**
   - Check Actions tab regularly
   - Review workflow logs if builds fail
   - Monitor site performance and loading times

---

🎉 **You're all set!** Your site should now automatically build and deploy whenever you push to the main branch.
