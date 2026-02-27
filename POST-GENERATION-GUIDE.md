# Blog Post Generation Guide

This guide helps you explore and implement more posts for your blog covering performance topics from 2019 to now.

## Current Status

Your blog currently has **19 posts** in `src/content/posts/`, all from November 2024. Based on your goal of **at least 2 posts per month from 2019 to now**, you need approximately **125+ additional posts**.

## Tools Created

I've created three scripts to help you manage and generate posts:

### 1. **analyze-posts.js**
Analyzes existing posts and identifies gaps in your posting schedule.

**Run it:**
```bash
node scripts/analyze-posts.js
```

This will:
- Count existing posts by month/year
- Identify months with fewer than 2 posts
- Generate topic suggestions for missing posts
- Create `post-analysis-report.json` with detailed analysis

### 2. **generate-post.js**
Creates a single new post with proper frontmatter.

**Example:**
```bash
node scripts/generate-post.js "ESP32 Power Optimization" \
  --category microcontrollers \
  --date 2024-01-15 \
  --tags esp32,power,optimization \
  --difficulty advanced
```

### 3. **generate-missing-posts.js**
Bulk generates posts for missing months.

**Preview first (recommended):**
```bash
node scripts/generate-missing-posts.js --dry-run --limit=20
```

**Generate posts:**
```bash
# For a specific year
node scripts/generate-missing-posts.js --year=2020 --limit=10

# For all gaps (be careful - this creates many files!)
node scripts/generate-missing-posts.js
```

## Post Categories

Your blog covers these performance-focused categories:

- **llm-inference** - LLM inference optimization, transformers, attention mechanisms
- **vllm** - vLLM-specific topics (PagedAttention, continuous batching, etc.)
- **microcontrollers** - MCU performance (ESP32, STM32, Cortex-M4, etc.)
- **hardware-optimization** - CPU/GPU hardware optimization
- **gpu-programming** - GPU programming, CUDA, Gaudi architecture
- **profiling** - Performance profiling (eBPF, perf, DTrace)
- **graphics** - Graphics and video acceleration
- **transformers** - Transformer architecture deep dives

## Topic Generation Strategy

The scripts use a deterministic algorithm that:
- Rotates through categories based on year/month
- Ensures variety while maintaining focus on performance
- Generates topics relevant to your themes:
  - LLM performance and optimization
  - MCU performance and power management
  - Hardware architecture and optimization
  - GPU programming and memory systems

## Recommended Workflow

### Step 1: Analyze Current State
```bash
node scripts/analyze-posts.js
```

Review the output and `post-analysis-report.json` to see:
- Which months need posts
- How many posts are needed
- Suggested topics for each gap

### Step 2: Preview Generated Posts
```bash
# Preview first 20 posts that would be generated
node scripts/generate-missing-posts.js --dry-run --limit=20
```

This shows you what would be created without actually creating files.

### Step 3: Generate Posts Incrementally

**Option A: By Year**
```bash
# Generate posts for 2019
node scripts/generate-missing-posts.js --year=2019

# Then 2020, 2021, etc.
node scripts/generate-missing-posts.js --year=2020
```

**Option B: Limited Batch**
```bash
# Generate 10 posts at a time
node scripts/generate-missing-posts.js --limit=10
```

**Option C: Individual Posts**
```bash
node scripts/generate-post.js "Your Specific Topic" \
  --category llm-inference \
  --date 2024-01-15
```

### Step 4: Fill in Content

Generated posts are templates with:
- Proper frontmatter (title, date, category, tags)
- Section placeholders
- MDX component imports
- Structure ready for your content

You'll need to:
1. Write the actual content
2. Add performance analysis
3. Include benchmarks and code examples
4. Add diagrams/charts using the MDX components

## Post Template Structure

Each generated post includes:

```mdx
---
title: "Post Title"
author: "stanley-phoong"
description: "Description"
publishDate: YYYY-MM-DD
category: category-name
tags: [tag1, tag2]
difficulty: advanced
---

import Callout from '@/components/mdx/Callout.astro';
import PerfChart from '@/components/mdx/PerfChart.astro';
import Benchmark from '@/components/mdx/Benchmark.astro';

## Introduction
## Background
## Performance Analysis
## Implementation Details
## Benchmarks
## Conclusion
```

## Sample Topics by Category

### LLM Inference
- Transformer Architecture Deep Dive
- KV Cache Optimization Strategies
- Attention Mechanism Performance
- Batch Processing Optimization
- Memory Bandwidth Analysis
- Quantization Techniques
- Speculative Decoding
- Continuous Batching
- PagedAttention Analysis
- Token Generation Pipeline

### Microcontrollers
- ESP32 Power Management
- ESP32 ADC Performance
- ESP32 WiFi Performance
- STM32 DMA Optimization
- Cortex-M4 DSP Performance
- MCU Cache Hierarchy
- MCU Interrupt Latency
- MCU Memory Bandwidth
- MCU Clock Gating
- MCU Register-level Optimization

### Hardware Optimization
- CPU Cache Hierarchy
- Memory Bandwidth Analysis
- SIMD Optimization
- Branch Prediction
- Instruction Pipelining
- NUMA Architecture
- CPU Affinity
- Memory Alignment
- False Sharing
- Cache Line Optimization

### GPU Programming
- CUDA Kernel Optimization
- GPU Memory Profiling
- CUDA Graphs for Inference
- GPU Memory Bandwidth
- Warp-level Optimization
- Shared Memory Usage
- Gaudi Architecture
- Gaudi Memory Subsystem
- GPU Cache Hierarchy

## Next Steps

1. **Run the analysis script** to see your current gaps
2. **Preview generated posts** to review topics
3. **Generate posts incrementally** (start with 10-20 at a time)
4. **Fill in content** for generated posts
5. **Repeat** until you have 2+ posts per month from 2019-2026

## Notes

- Generated posts are templates - you need to write the actual content
- Posts are created in `src/content/posts/`
- Existing posts are never overwritten
- All posts default to `stanley-phoong` author
- The scripts use deterministic algorithms to ensure variety

## Questions?

Check `scripts/README.md` for detailed script documentation.
