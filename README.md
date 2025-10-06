# fridayswithfaraday.com

Personal site for embedded systems and microcontroller work.

## Quick Start

1. **Clone this repo**
   ```bash
   git clone https://github.com/yourusername/yourusername.github.io.git
   cd yourusername.github.io
   ```

2. **Test locally**
   - Open `index.html` in your browser
   - Or use a local server:
     ```bash
     python3 -m http.server 8000
     # Visit http://localhost:8000
     ```

3. **Deploy to GitHub Pages**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **Set up custom domain** (optional)
   - In GitHub repo settings → Pages
   - Add custom domain: `fridayswithfaraday.com`
   - Update your DNS:
     - Add A records pointing to:
       - 185.199.108.153
       - 185.199.109.153
       - 185.199.110.153
       - 185.199.111.153
     - Or add CNAME record: `yourusername.github.io`

## Adding New Experiments

1. Create a new file: `experiments/your-project.html`
2. Copy template from existing experiment
3. Update content
4. Add card to `experiments.html`
5. Push to GitHub

## File Structure

```
/
├── index.html          # Homepage
├── experiments.html    # All experiments listing
├── CNAME              # Custom domain config
├── css/
│   └── style.css      # All styles
├── js/
│   └── main.js        # Interactions
└── experiments/
    ├── esp32-low-power.html
    └── stm32-dma.html
```

## Technologies

- Pure HTML/CSS/JavaScript (no build process)
- No dependencies
- Mobile responsive
- Dark theme optimized for technical content
