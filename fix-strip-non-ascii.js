#!/usr/bin/env node
/**
 * fix-strip-non-ascii.js
 * 
 * NUCLEAR OPTION: Remove ALL non-ASCII characters from MDX files.
 * 
 * The posts have a mix of proper UTF-8 and double-encoded mojibake
 * (â€™ instead of ', Ã— instead of ×, etc.) that the MDX acorn parser
 * cannot handle inside JSX expressions.
 * 
 * This script replaces known mojibake sequences with ASCII equivalents,
 * then strips any remaining non-ASCII characters.
 * 
 * Run: node fix-strip-non-ascii.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

const POSTS_DIR = './src/content/posts/';
const DRY_RUN = process.argv.includes('--dry-run');

// Known mojibake patterns (double-encoded UTF-8 through cp1252)
const MOJIBAKE_MAP = [
  // Smart quotes (double-encoded)
  [/â€™/g, "'"],      // right single quote U+2019
  [/â€˜/g, "'"],      // left single quote U+2018  
  [/â€œ/g, '"'],      // left double quote U+201C
  [/â€\u009d/g, '"'],  // right double quote U+201D
  [/â€"/g, '--'],     // em dash U+2014
  [/â€"/g, '-'],      // en dash U+2013
  
  // Math (double-encoded)
  [/Ã—/g, 'x'],      // multiplication sign
  [/Ã·/g, '/'],      // division sign
  [/Â²/g, '^2'],     // superscript 2
  [/Â³/g, '^3'],     // superscript 3  
  [/Â±/g, '+/-'],    // plus-minus
  [/Âµ/g, 'u'],      // micro sign
  [/Â·/g, '.'],      // middle dot
  [/Â°/g, ' deg'],   // degree sign
  [/Â©/g, '(c)'],    // copyright
  
  // Arrows (double-encoded)
  [/â†'/g, '->'],    // right arrow
  [/â†'/g, '->'],    // right arrow variant
  [/â†"/g, 'down'],  // down arrow
  
  // Math operators (double-encoded)
  [/â‰¤/g, '<='],    // less than or equal
  [/â‰¥/g, '>='],    // greater than or equal
  [/â‰ˆ/g, '~'],     // approximately
  [/âˆž/g, 'inf'],   // infinity
  [/âˆ'/g, 'sum'],   // summation
  
  // Greek (double-encoded)
  [/Î£/g, 'Sigma'],
  [/Î©/g, 'Omega'],
  [/Î³/g, 'gamma'],
  [/Î¸/g, 'theta'],
  [/Î¼/g, 'mu'],
  
  // Box drawing (double-encoded)  
  [/â"€/g, '-'],
  [/â"‚/g, '|'],
  
  // Emoji (double-encoded) - just remove
  [/ðŸ"Š/g, ''],
  [/ðŸ"'/g, ''],
  [/ðŸ""/g, ''],
  [/âš¡/g, ''],
  [/âœ"/g, ''],
  [/âœ—/g, ''],
  [/â\u008c˜/g, ''],
];

// Proper UTF-8 single-encoded replacements
const UNICODE_MAP = [
  [/×/g, 'x'],
  [/÷/g, '/'],
  [/²/g, '^2'],
  [/³/g, '^3'],
  [/±/g, '+/-'],
  [/µ/g, 'u'],
  [/·/g, '.'],
  [/°/g, ' deg'],
  [/—/g, '--'],
  [/–/g, '-'],
  [/→/g, '->'],
  [/←/g, 'from'],
  [/↑/g, 'up'],
  [/↓/g, 'down'],
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/≈/g, '~'],
  [/≠/g, '!='],
  [/∞/g, 'inf'],
  [/π/g, 'pi'],
  [/α/g, 'alpha'],
  [/β/g, 'beta'],
  [/σ/g, 'sigma'],
  [/Σ/g, 'Sigma'],
  [/λ/g, 'lambda'],
  [/ε/g, 'epsilon'],
  [/δ/g, 'delta'],
  [/γ/g, 'gamma'],
  [/θ/g, 'theta'],
  [/─/g, '-'],
  [/\u2018/g, "'"],   // left single quote
  [/\u2019/g, "'"],   // right single quote
  [/\u201C/g, '"'],   // left double quote
  [/\u201D/g, '"'],   // right double quote
  [/…/g, '...'],
  [/•/g, '*'],
];

function fixFile(content) {
  let modified = content;
  let replacements = 0;

  // Phase 1: Fix known mojibake patterns
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) replacements++;
  }

  // Phase 2: Fix proper Unicode
  for (const [pattern, replacement] of UNICODE_MAP) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) replacements++;
  }

  // Phase 3: Strip ANY remaining non-ASCII characters that aren't in code blocks
  // We need to be careful to preserve code block content where non-ASCII might be OK
  // Actually, for MDX safety, strip ALL non-ASCII outside of code fences
  const lines = modified.split('\n');
  let inCodeBlock = false;
  const cleanedLines = lines.map(line => {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) {
      return line; // Preserve code block content
    }
    // Outside code blocks: strip non-ASCII
    const cleaned = line.replace(/[^\x00-\x7E]/g, '');
    if (cleaned !== line) replacements++;
    return cleaned;
  });

  modified = cleanedLines.join('\n');

  return { content: modified, replacements };
}

// Main
console.log(`\n🔧 Strip Non-ASCII from MDX (Nuclear Option)`);
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

let files;
try {
  files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'));
} catch (e) {
  console.error(`Cannot read ${POSTS_DIR}: ${e.message}`);
  process.exit(1);
}

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.log(`  ⚠ Cannot read ${file}`);
    continue;
  }

  // Check if file has any non-ASCII
  if (!/[^\x00-\x7E]/.test(content)) continue;

  const result = fixFile(content);

  if (result.replacements > 0) {
    console.log(`✏️  ${file} — ${result.replacements} fixes`);
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, result.content, 'utf8');
    }
    totalFixed++;
  }
}

console.log(`\n📊 Fixed ${totalFixed} files out of ${files.length} total`);
if (DRY_RUN) console.log(`   Run without --dry-run to apply.`);
