#!/usr/bin/env node
/**
 * fix-mdx-parse-errors.js
 * 
 * Comprehensive fixer for ALL MDX parse errors:
 * 1. LaTeX \(...\) and \[...\] delimiters -> $...$ and $$...$$ (remark-math compatible)
 * 2. Double-encoded mojibake -> ASCII
 * 3. Proper Unicode -> ASCII  
 * 4. Strip remaining non-ASCII outside code fences
 * 5. Fix < and > in JSX string props
 * 6. Fix PerfChart data={{ }} -> chartData={{ }}
 *
 * Run: node fix-mdx-parse-errors.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

const POSTS_DIR = './src/content/posts/';
const DRY_RUN = process.argv.includes('--dry-run');

function fixFile(content, filename) {
  let modified = content;
  let fixes = 0;

  // ── Phase 1: Fix LaTeX delimiters ──
  // \( ... \) inline math -> $ ... $
  // Must be careful not to match \( inside code blocks
  const beforeLatex = modified;
  modified = modified.replace(/\\\(([^)]*?)\\\)/g, (match, inner) => {
    return '$' + inner + '$';
  });
  // \[ ... \] display math -> $$ ... $$
  modified = modified.replace(/\\\[([\s\S]*?)\\\]/g, (match, inner) => {
    return '$$' + inner.trim() + '$$';
  });
  if (modified !== beforeLatex) {
    fixes++;
    console.log(`    [latex] Fixed \\( \\) and \\[ \\] delimiters`);
  }

  // ── Phase 2: Fix mojibake (double-encoded UTF-8) ──
  const mojibake = [
    [/â€™/g, "'"], [/â€˜/g, "'"], [/â€œ/g, '"'], [/â€\u009d/g, '"'],
    [/â€"/g, '--'], [/â€"/g, '-'],
    [/Ã—/g, 'x'], [/Ã·/g, '/'],
    [/Â²/g, '^2'], [/Â³/g, '^3'], [/Â±/g, '+/-'], [/Âµ/g, 'u'],
    [/Â·/g, '.'], [/Â°/g, ' deg'], [/Â©/g, '(c)'],
    [/â†'/g, '->'], [/â†'/g, '->'], [/â†"/g, 'down'],
    [/â‰¤/g, '<='], [/â‰¥/g, '>='], [/â‰ˆ/g, '~'],
    [/âˆž/g, 'inf'], [/âˆ'/g, 'sum'],
    [/Î£/g, 'Sigma'], [/Î©/g, 'Omega'], [/Î³/g, 'gamma'],
    [/Î¸/g, 'theta'], [/Î¼/g, 'mu'],
    [/â"€/g, '-'], [/â"‚/g, '|'],
    [/ðŸ"Š/g, ''], [/ðŸ"'/g, ''], [/ðŸ""/g, ''],
    [/âš¡/g, ''], [/âœ"/g, ''], [/âœ—/g, ''],
  ];
  for (const [pattern, replacement] of mojibake) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) fixes++;
  }

  // ── Phase 3: Fix proper Unicode ──
  const unicode = [
    [/×/g, 'x'], [/÷/g, '/'], [/²/g, '^2'], [/³/g, '^3'],
    [/±/g, '+/-'], [/µ/g, 'u'], [/·/g, '.'], [/°/g, ' deg'],
    [/—/g, '--'], [/–/g, '-'],
    [/→/g, '->'], [/←/g, 'from'], [/↑/g, 'up'], [/↓/g, 'down'],
    [/≤/g, '<='], [/≥/g, '>='], [/≈/g, '~'], [/≠/g, '!='],
    [/∞/g, 'inf'], [/π/g, 'pi'],
    [/α/g, 'alpha'], [/β/g, 'beta'], [/σ/g, 'sigma'], [/Σ/g, 'Sigma'],
    [/λ/g, 'lambda'], [/ε/g, 'epsilon'], [/δ/g, 'delta'],
    [/γ/g, 'gamma'], [/θ/g, 'theta'],
    [/─/g, '-'],
    [/\u2018/g, "'"], [/\u2019/g, "'"],
    [/\u201C/g, '"'], [/\u201D/g, '"'],
    [/…/g, '...'], [/•/g, '*'],
  ];
  for (const [pattern, replacement] of unicode) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) fixes++;
  }

  // ── Phase 4: Strip remaining non-ASCII outside code fences ──
  const lines = modified.split('\n');
  let inCodeBlock = false;
  const cleaned = lines.map(line => {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;
    const c = line.replace(/[^\x00-\x7E]/g, '');
    if (c !== line) fixes++;
    return c;
  });
  modified = cleaned.join('\n');

  // ── Phase 5: Fix < and > in JSX string values ──
  // Inside "..." values in component props, replace <N with "under N"
  modified = modified.replace(/"([^"]*)<(\d)/g, (m, before, d) => {
    fixes++;
    return `"${before}under ${d}`;
  });
  modified = modified.replace(/"([^"]*)< (\d)/g, (m, before, d) => {
    fixes++;
    return `"${before}under ${d}`;
  });
  // >N in strings (but not component tags)
  modified = modified.replace(/"([^"]*)>(\d)/g, (m, before, d) => {
    if (/\w$/.test(before)) return m; // skip if word char before > (component tag)
    fixes++;
    return `"${before}over ${d}`;
  });

  // ── Phase 6: Fix PerfChart broken API ──
  // data={{ labels:..., datasets:[{label, data, borderColor}] }}
  // -> chartData={{ labels:..., series:[{label, values, color}] }}
  // Also remove options={{ }} prop
  const perfChartRegex = /<PerfChart\s[\s\S]*?\/>/g;
  modified = modified.replace(perfChartRegex, (match) => {
    if (!/datasets/.test(match)) return match;
    let fixed = match;
    fixed = fixed.replace(/\bdata=\{\{/, 'chartData={{');
    fixed = fixed.replace(/datasets:\s*\[/, 'series: [');
    fixed = fixed.replace(/\{\s*label:\s*"([^"]*)",\s*data:\s*(\[[^\]]*\]),\s*borderColor:\s*"([^"]*)"(?:,\s*backgroundColor:\s*"[^"]*")?\s*\}/g,
      (_, label, values, color) => `{ label: "${label}", values: ${values}, color: "${color}" }`
    );
    fixed = fixed.replace(/\s*options=\{\{[\s\S]*?\}\}\s*(?=\/>)/g, '\n');
    if (fixed !== match) fixes++;
    return fixed;
  });

  return { content: modified, fixes };
}

// Main
console.log(`\n🔧 Comprehensive MDX Parse Error Fixer`);
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

  const result = fixFile(content, file);
  if (result.fixes > 0) {
    console.log(`✏️  ${file} -- ${result.fixes} fixes`);
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, result.content, 'utf8');
    }
    totalFixed++;
  }
}

console.log(`\n📊 Fixed ${totalFixed} out of ${files.length} files`);
if (DRY_RUN) console.log(`   Run without --dry-run to apply.`);
