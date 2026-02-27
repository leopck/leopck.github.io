#!/usr/bin/env node

/**
 * Generate multiple posts for missing months based on analysis
 * Usage: node scripts/generate-missing-posts.js [--dry-run] [--year 2020] [--limit 10]
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance topics organized by category
const TOPIC_TEMPLATES = {
  'llm-inference': [
    'Transformer Architecture Deep Dive',
    'KV Cache Optimization Strategies',
    'Attention Mechanism Performance',
    'Batch Processing Optimization',
    'Memory Bandwidth Analysis',
    'Quantization Techniques',
    'Speculative Decoding',
    'Continuous Batching',
    'PagedAttention Analysis',
    'Token Generation Pipeline',
    'Model Parallelism',
    'Tensor Parallelism',
    'Pipeline Parallelism',
    'Flash Attention Implementation',
    'Long Context Handling',
    'ROPE Embeddings',
    'Grouped Query Attention',
    'Multi-Query Attention',
    'System Calls in LLM Inference',
    'CPU-GPU Coordination',
  ],
  'vllm': [
    'vLLM PagedAttention Memory Analysis',
    'vLLM Batch Processing',
    'vLLM KV Cache Management',
    'vLLM Memory Pool Optimization',
    'vLLM Token Generation',
    'vLLM Continuous Batching',
    'vLLM Scheduling Algorithms',
    'vLLM Preemption Strategies',
    'vLLM Memory Fragmentation',
    'vLLM Performance Profiling',
  ],
  'microcontrollers': [
    'ESP32 Power Management',
    'ESP32 ADC Performance',
    'ESP32 WiFi Performance',
    'ESP32 Ultra Low Power',
    'ESP32 Deep Sleep Optimization',
    'STM32 DMA Optimization',
    'Cortex-M4 DSP Performance',
    'MCU Cache Hierarchy',
    'MCU Interrupt Latency',
    'MCU Memory Bandwidth',
    'MCU Clock Gating',
    'MCU Peripheral Optimization',
    'MCU Bootloader Performance',
    'MCU Real-time Constraints',
    'MCU Power Consumption Analysis',
    'MCU Register-level Optimization',
    'MCU Assembly Optimization',
    'MCU Compiler Optimizations',
    'MCU Flash vs RAM Performance',
    'MCU I2C Bus Optimization',
  ],
  'hardware-optimization': [
    'CPU Cache Hierarchy',
    'Memory Bandwidth Analysis',
    'SIMD Optimization',
    'Branch Prediction',
    'Instruction Pipelining',
    'Out-of-Order Execution',
    'NUMA Architecture',
    'CPU Affinity',
    'Memory Alignment',
    'False Sharing',
    'Cache Line Optimization',
    'Prefetching Strategies',
    'TLB Optimization',
    'Page Fault Performance',
    'Memory Mapping',
  ],
  'gpu-programming': [
    'CUDA Kernel Optimization',
    'GPU Memory Profiling',
    'CUDA Graphs for Inference',
    'GPU Memory Bandwidth',
    'Warp-level Optimization',
    'Shared Memory Usage',
    'Register Spilling',
    'Occupancy Optimization',
    'Tensor Core Utilization',
    'Gaudi Architecture',
    'Gaudi Memory Subsystem',
    'Gaudi Mixed Precision',
    'GPU Cache Hierarchy',
    'GPU Warp Scheduling',
    'GPU Memory Coalescing',
  ],
  'profiling': [
    'eBPF LLM Profiling',
    'perf Tool Deep Dive',
    'DTrace Analysis',
    'System Call Tracing',
    'Memory Profiling',
    'CPU Profiling',
    'GPU Profiling',
    'Flame Graph Analysis',
    'Performance Counters',
    'Hardware Performance Counters',
  ],
  'graphics': [
    'DXVA Performance',
    'VAAPI Multithreading',
    'Level Zero Analysis',
    'Video Decode Performance',
    'GPU Video Acceleration',
  ],
};

// Generate topics for a given month/year
function generateTopicsForMonth(year, month, existingCount = 0) {
  const categories = Object.keys(TOPIC_TEMPLATES);
  const categoryIndex = (year * 12 + month) % categories.length;
  const selectedCategory = categories[categoryIndex];
  const categoryTopics = TOPIC_TEMPLATES[selectedCategory];
  
  const topics = [];
  const needed = 2 - existingCount;
  
  for (let i = 0; i < needed; i++) {
    const topicIndex = (year * 12 + month + i) % categoryTopics.length;
    const day = 1 + (i * 14) + (topicIndex % 14); // Spread across month
    
    topics.push({
      title: categoryTopics[topicIndex],
      category: selectedCategory,
      date: new Date(year, month - 1, day),
      slug: categoryTopics[topicIndex]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    });
  }
  
  return topics;
}

// Generate post content template
function generatePostContent(topic) {
  const dateStr = topic.date.toISOString().split('T')[0];
  
  return `---
title: "${topic.title}"
author: "stanley-phoong"
description: "Deep dive into ${topic.title.toLowerCase()}. Performance analysis, optimization strategies, and practical insights."
publishDate: ${dateStr}
category: ${topic.category}
tags: [${topic.category}, performance, optimization]
difficulty: advanced
---

import Callout from '@/components/mdx/Callout.astro';
import PerfChart from '@/components/mdx/PerfChart.astro';
import Benchmark from '@/components/mdx/Benchmark.astro';

## Introduction

[Write your introduction here - explain the topic and why performance matters]

## Background

[Provide context and background information]

## Performance Analysis

[Add performance analysis, benchmarks, and insights]

### Key Metrics

[Discuss key performance metrics]

### Optimization Strategies

[Describe optimization techniques]

## Implementation Details

[Provide implementation details and code examples]

## Benchmarks

[Include benchmark results and analysis]

## Conclusion

[Summarize key findings and takeaways]

`;
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const yearFilter = args.find(arg => arg.startsWith('--year='))?.split('=')[1];
const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const limit = limitArg ? parseInt(limitArg) : null;

async function main() {
  const postsDir = join(__dirname, '../src/content/posts');
  
  // Read existing posts to find gaps
  let files = [];
  try {
    const { readdir } = await import('fs/promises');
    files = await readdir(postsDir);
  } catch (err) {
    console.error('Error reading posts directory:', err);
    return;
  }
  
  const mdxFiles = files.filter(f => f.endsWith('.mdx'));
  const posts = [];
  
  for (const file of mdxFiles) {
    try {
      const content = await readFile(join(postsDir, file), 'utf-8');
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatter) {
        const fm = frontmatter[1];
        const publishDateMatch = fm.match(/publishDate:\s*(\d{4}-\d{2}-\d{2})/);
        if (publishDateMatch) {
          const date = new Date(publishDateMatch[1]);
          posts.push({
            file,
            date,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          });
        }
      }
    } catch (err) {
      // Skip files we can't read
    }
  }
  
  // Group by year/month
  const postsByMonth = {};
  posts.forEach(post => {
    const key = `${post.year}-${String(post.month).padStart(2, '0')}`;
    if (!postsByMonth[key]) {
      postsByMonth[key] = [];
    }
    postsByMonth[key].push(post);
  });
  
  // Find gaps
  const gaps = [];
  const startYear = yearFilter ? parseInt(yearFilter) : 2019;
  const endYear = new Date().getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const monthsInYear = year === endYear ? new Date().getMonth() + 1 : 12;
    for (let month = 1; month <= monthsInYear; month++) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const existingPosts = postsByMonth[key] || [];
      
      if (existingPosts.length < 2) {
        const needed = 2 - existingPosts.length;
        gaps.push({
          year,
          month,
          existing: existingPosts.length,
          needed,
        });
      }
    }
  }
  
  // Generate posts for gaps
  const postsToGenerate = [];
  let count = 0;
  
  for (const gap of gaps) {
    if (limit && count >= limit) break;
    
    const topics = generateTopicsForMonth(gap.year, gap.month, gap.existing);
    for (const topic of topics) {
      if (limit && count >= limit) break;
      
      const filename = `${topic.slug}.mdx`;
      const filepath = join(postsDir, filename);
      
      // Skip if file already exists
      if (existsSync(filepath)) {
        console.log(`⏭️  Skipping ${filename} (already exists)`);
        continue;
      }
      
      postsToGenerate.push({
        topic,
        filename,
        filepath,
        content: generatePostContent(topic),
      });
      count++;
    }
  }
  
  if (dryRun) {
    console.log(`\n📝 Would generate ${postsToGenerate.length} posts:\n`);
    postsToGenerate.forEach(({ topic, filename }) => {
      console.log(`  ${filename}`);
      console.log(`    Title: ${topic.title}`);
      console.log(`    Category: ${topic.category}`);
      console.log(`    Date: ${topic.date.toISOString().split('T')[0]}\n`);
    });
  } else {
    console.log(`\n📝 Generating ${postsToGenerate.length} posts...\n`);
    
    for (const { topic, filename, filepath, content } of postsToGenerate) {
      try {
        await writeFile(filepath, content, 'utf-8');
        console.log(`✅ Created: ${filename}`);
      } catch (error) {
        console.error(`❌ Error creating ${filename}:`, error.message);
      }
    }
    
    console.log(`\n✨ Done! Generated ${postsToGenerate.length} posts.`);
  }
}

main().catch(console.error);
