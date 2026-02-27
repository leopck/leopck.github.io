#!/usr/bin/env node

/**
 * Analyze existing blog posts and identify gaps
 * Generates a report of missing posts and suggests topics
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const postsDir = join(__dirname, '../src/content/posts');

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
function generateTopicsForMonth(year, month, category) {
  const templates = TOPIC_TEMPLATES[category] || [];
  const topics = [];
  
  // Rotate through categories
  const categories = Object.keys(TOPIC_TEMPLATES);
  const categoryIndex = (year * 12 + month) % categories.length;
  const selectedCategory = categories[categoryIndex];
  
  // Get 2 topics from the selected category
  const categoryTopics = TOPIC_TEMPLATES[selectedCategory];
  const topicIndex1 = (year * 12 + month) % categoryTopics.length;
  const topicIndex2 = (year * 12 + month + 1) % categoryTopics.length;
  
  return [
    {
      title: categoryTopics[topicIndex1],
      category: selectedCategory,
      date: new Date(year, month - 1, 1 + (topicIndex1 % 15)),
    },
    {
      title: categoryTopics[topicIndex2],
      category: selectedCategory,
      date: new Date(year, month - 1, 15 + (topicIndex2 % 15)),
    },
  ];
}

// Analyze existing posts
async function analyzePosts() {
  try {
    const files = await readdir(postsDir);
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
        console.error(`Error reading ${file}:`, err.message);
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
    
    // Find gaps from 2019 to 2024
    const gaps = [];
    const suggestions = [];
    
    for (let year = 2019; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
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
          
          // Generate suggestions
          const monthTopics = generateTopicsForMonth(year, month, 'llm-inference');
          suggestions.push({
            year,
            month,
            topics: monthTopics.slice(0, needed),
          });
        }
      }
    }
    
    // Also check 2025 and 2026
    const currentYear = new Date().getFullYear();
    for (let year = 2025; year <= currentYear; year++) {
      const monthsInYear = year === currentYear ? new Date().getMonth() + 1 : 12;
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
          
          const monthTopics = generateTopicsForMonth(year, month, 'llm-inference');
          suggestions.push({
            year,
            month,
            topics: monthTopics.slice(0, needed),
          });
        }
      }
    }
    
    return {
      totalPosts: posts.length,
      postsByMonth,
      gaps,
      suggestions,
    };
  } catch (err) {
    console.error('Error analyzing posts:', err);
    throw err;
  }
}

// Main execution
async function main() {
  const analysis = await analyzePosts();
  
  console.log('\n=== Blog Post Analysis ===\n');
  console.log(`Total existing posts: ${analysis.totalPosts}`);
  console.log(`Posts by month: ${Object.keys(analysis.postsByMonth).length} months with posts\n`);
  
  console.log(`=== Gaps Found ===\n`);
  console.log(`Total months needing posts: ${analysis.gaps.length}`);
  console.log(`Total posts needed: ${analysis.gaps.reduce((sum, g) => sum + g.needed, 0)}\n`);
  
  // Group gaps by year
  const gapsByYear = {};
  analysis.gaps.forEach(gap => {
    if (!gapsByYear[gap.year]) {
      gapsByYear[gap.year] = [];
    }
    gapsByYear[gap.year].push(gap);
  });
  
  Object.keys(gapsByYear).sort().forEach(year => {
    const yearGaps = gapsByYear[year];
    const totalNeeded = yearGaps.reduce((sum, g) => sum + g.needed, 0);
    console.log(`${year}: ${yearGaps.length} months, ${totalNeeded} posts needed`);
  });
  
  console.log('\n=== Sample Suggestions (First 20) ===\n');
  analysis.suggestions.slice(0, 20).forEach(suggestion => {
    console.log(`${suggestion.year}-${String(suggestion.month).padStart(2, '0')}:`);
    suggestion.topics.forEach(topic => {
      console.log(`  - ${topic.title} (${topic.category}) - ${topic.date.toISOString().split('T')[0]}`);
    });
  });
  
  // Write detailed report to file
  const report = {
    summary: {
      totalPosts: analysis.totalPosts,
      totalGaps: analysis.gaps.length,
      totalPostsNeeded: analysis.gaps.reduce((sum, g) => sum + g.needed, 0),
    },
    gaps: analysis.gaps,
    suggestions: analysis.suggestions,
  };
  
  const fs = await import('fs/promises');
  await fs.writeFile(
    join(__dirname, '../post-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n=== Detailed report saved to post-analysis-report.json ===\n');
}

main().catch(console.error);
