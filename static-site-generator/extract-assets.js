const fs = require('fs');

try {
  const source = fs.readFileSync('/workspace/user_input_files/leopck-leopck.github.io-8a5edab282632443.txt', 'utf-8');

  // Extract CSS using simple regex
  let cssStart = source.indexOf('FILE: css/style.css');
  if (cssStart !== -1) {
    const cssSection = source.substring(cssStart, cssStart + 50000);
    const cssMatch = cssSection.match(/```css\s+([\s\S]*?)\s+```/);
    if (cssMatch) {
      fs.writeFileSync('assets/css/style.css', cssMatch[1]);
      console.log('✓ Extracted style.css');
    }
  }

  // Extract JS  
  let jsStart = source.indexOf('FILE: js/main.js');
  if (jsStart !== -1) {
    const jsSection = source.substring(jsStart, jsStart + 10000);
    const jsMatch = jsSection.match(/```javascript\s+([\s\S]*?)\s+```/);
    if (jsMatch) {
      fs.writeFileSync('assets/js/main.js', jsMatch[1]);
      console.log('✓ Extracted main.js');
    }
  }

  console.log('Assets extracted successfully!');
} catch (error) {
  console.error('Error:', error);
}
