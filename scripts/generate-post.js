#!/usr/bin/env node

/**
 * Generate a new blog post with proper frontmatter
 * Usage: node scripts/generate-post.js "Post Title" --category llm-inference --date 2024-01-15
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const titleIndex = args.findIndex(arg => !arg.startsWith('--'));
const title = titleIndex >= 0 ? args[titleIndex] : null;

const getArg = (flag) => {
  const index = args.findIndex(arg => arg === flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
};

const category = getArg('--category') || 'llm-inference';
const date = getArg('--date') || new Date().toISOString().split('T')[0];
const tags = getArg('--tags') ? getArg('--tags').split(',') : [];
const difficulty = getArg('--difficulty') || 'advanced';
const author = getArg('--author') || 'stanley-phoong';
const description = getArg('--description') || `Deep dive into ${title || 'performance optimization'}`;

if (!title) {
  console.error('Usage: node scripts/generate-post.js "Post Title" [options]');
  console.error('\nOptions:');
  console.error('  --category <category>     Category (default: llm-inference)');
  console.error('  --date <YYYY-MM-DD>       Publish date (default: today)');
  console.error('  --tags <tag1,tag2,...>     Comma-separated tags');
  console.error('  --difficulty <level>      Difficulty: beginner, intermediate, advanced, expert');
  console.error('  --author <author-id>      Author ID (default: stanley-phoong)');
  console.error('  --description <text>     Post description');
  process.exit(1);
}

// Generate slug from title
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Generate frontmatter
const frontmatter = `---
title: "${title}"
author: "${author}"
description: "${description}"
publishDate: ${date}
category: ${category}
tags: [${tags.length > 0 ? tags.map(t => t.trim()).join(', ') : category}]
difficulty: ${difficulty}
---

import Callout from '@/components/mdx/Callout.astro';
import PerfChart from '@/components/mdx/PerfChart.astro';
import Benchmark from '@/components/mdx/Benchmark.astro';

## Introduction

[Write your introduction here]

## Main Content

[Write your main content here]

## Performance Analysis

[Add performance analysis, benchmarks, and insights]

## Conclusion

[Summarize key findings and takeaways]

`;

// Write file
const postsDir = join(__dirname, '../src/content/posts');
const filename = `${slug}.mdx`;
const filepath = join(postsDir, filename);

try {
  await writeFile(filepath, frontmatter, 'utf-8');
  console.log(`✅ Created post: ${filename}`);
  console.log(`   Location: ${filepath}`);
  console.log(`   Category: ${category}`);
  console.log(`   Date: ${date}`);
} catch (error) {
  console.error(`❌ Error creating post:`, error.message);
  process.exit(1);
}
