import { compile } from 'astro/compiler';
import fs from 'fs';
import path from 'path';

const postsDir = path.resolve('src/content/posts');
const files = fs.readdirSync(postsDir);

let errors = [];

for (const file of files) {
  if (file.endsWith('.mdx')) {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      compile(content);
      console.log(`✓ ${file} compiled successfully`);
    } catch (e) {
      errors.push({ file, error: e.message });
      console.error(`✗ ${file} failed to compile`);
      console.error(e.message);
    }
  }
}

if (errors.length > 0) {
  console.error(`\nFound ${errors.length} compilation errors`);
  process.exit(1);
} else {
  console.log('\nAll posts compiled successfully');
}