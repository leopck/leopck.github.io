const fs = require('fs');
const path = require('path');

// Configuration - can be overridden via command line arguments
const INPUT_FILE = process.argv[2] || 'user_input_files/leopck-leopck.github.io-8a5edab282632443.txt';
const ASSETS_DIR = 'static-site-generator/assets';

try {
  console.log(`Reading from: ${INPUT_FILE}`);
  const source = fs.readFileSync(INPUT_FILE, 'utf-8');

  // Extract CSS using simple regex
  let cssStart = source.indexOf('FILE: css/style.css');
  if (cssStart !== -1) {
    const cssSection = source.substring(cssStart, cssStart + 50000);
    const cssMatch = cssSection.match(/```css\s+([\s\S]*?)\s+```/);
    if (cssMatch) {
      const cssDir = path.join(ASSETS_DIR, 'css');
      if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
      }
      fs.writeFileSync(path.join(cssDir, 'style.css'), cssMatch[1]);
      console.log('✓ Extracted style.css');
    }
  }

  // Extract JS  
  let jsStart = source.indexOf('FILE: js/main.js');
  if (jsStart !== -1) {
    const jsSection = source.substring(jsStart, jsStart + 10000);
    const jsMatch = jsSection.match(/```javascript\s+([\s\S]*?)\s+```/);
    if (jsMatch) {
      const jsDir = path.join(ASSETS_DIR, 'js');
      if (!fs.existsSync(jsDir)) {
        fs.mkdirSync(jsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(jsDir, 'main.js'), jsMatch[1]);
      console.log('✓ Extracted main.js');
    }
  }

  console.log('Assets extracted successfully!');
} catch (error) {
  console.error('Error:', error);
}
