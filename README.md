# Fridays with Faraday

A modern, performance-focused technical blog built with Astro and MDX. Designed for deep technical content on systems optimization, embedded programming, and LLM inference.

## 🚀 Features

- **Astro 4.15** with MDX support for rich technical content
- **Custom MDX Components** for technical visualizations:
  - `RegisterDiagram` - Hardware register bit-field visualization
  - `MemoryLayout` - Memory map and region diagrams
  - `PerfChart` - Performance comparison bar charts
  - `Benchmark` - Benchmark result tables
  - `Callout` - Info, warning, danger, tip boxes
  - `CodeCompare` - Side-by-side code comparisons
- **Syntax Highlighting** with Shiki (One Dark Pro theme)
- **Math Support** via KaTeX
- **Dark Theme** with terminal-inspired aesthetics
- **Responsive Design** with mobile-first approach
- **SEO Optimized** with Open Graph and Twitter cards
- **RSS Feed** for subscribers
- **GitHub Pages Ready** with deployment workflow

## 📁 Project Structure

```
fridayswithfaraday/
├── src/
│   ├── components/        # Astro components
│   │   ├── mdx/          # Custom MDX components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── ...
│   ├── content/
│   │   └── posts/        # MDX blog posts
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   └── styles/           # SCSS styles
├── public/               # Static assets
├── astro.config.mjs      # Astro configuration
└── package.json
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone or download this project
cd fridayswithfaraday

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The dev server runs at `http://localhost:4321` with hot reloading.

## 📝 Writing Posts

Create new posts in `src/content/posts/` as MDX files:

```mdx
---
title: "Your Post Title"
description: "A brief description"
publishDate: 2024-11-15
category: vllm  # or: microcontrollers, llm-inference, profiling, etc.
tags: [tag1, tag2, tag3]
difficulty: intermediate  # beginner, intermediate, advanced, expert
readingTime: 15
featured: false
draft: false
---

import Callout from '@/components/mdx/Callout.astro';

Your content here...

<Callout type="warning" title="Important">
  This is a warning callout.
</Callout>
```

### Available Categories

- `microcontrollers` - Embedded systems, ESP32, ARM
- `vllm` - vLLM internals and optimization
- `llm-inference` - LLM inference general
- `transformers` - Attention, architectures
- `hardware-optimization` - CPU/GPU optimization
- `profiling` - Performance analysis
- `kernel-development` - CUDA, custom kernels
- `memory-systems` - Memory hierarchy
- `distributed-systems` - Multi-GPU, serving
- `gpu-programming` - CUDA, Gaudi

### Difficulty Levels

- `beginner` - Foundational concepts
- `intermediate` - Practical implementation
- `advanced` - Deep technical details
- `expert` - Cutting-edge research level

## 🧩 Custom Components

### Callout

```mdx
<Callout type="info" title="Note">
  Informational content here.
</Callout>
```

Types: `info`, `warning`, `danger`, `tip`, `perf`

### RegisterDiagram

```mdx
<RegisterDiagram
  name="GPIO_CTRL_REG"
  address="0x40000000"
  bits={[
    { range: "31:16", name: "Reserved", desc: "Reserved bits", color: "gray" },
    { range: "15:8", name: "MODE", desc: "Operating mode", color: "blue" },
    { range: "7:0", name: "VALUE", desc: "Output value", color: "green" },
  ]}
/>
```

### MemoryLayout

```mdx
<MemoryLayout
  title="Memory Map"
  regions={[
    { start: "0x00000000", end: "0x0FFFFFFF", name: "Flash", size: "256MB", color: "blue" },
    { start: "0x20000000", end: "0x2FFFFFFF", name: "SRAM", size: "256MB", color: "green" },
  ]}
/>
```

### PerfChart

```mdx
<PerfChart
  title="Performance Comparison"
  unit="ops/sec"
  data={[
    { label: "Baseline", value: 1000, color: "gray" },
    { label: "Optimized", value: 2500, color: "green" },
  ]}
/>
```

### Benchmark

```mdx
<Benchmark
  title="Results"
  columns={["Config", "Throughput", "Latency"]}
  rows={[
    { values: ["A", "100", "10ms"], highlight: false },
    { values: ["B", "250", "8ms"], highlight: true },
  ]}
  notes="Measured on A100"
/>
```

## 🚀 Deployment

### GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. The workflow in `.github/workflows/deploy.yml` handles deployment automatically

### Manual Deployment

```bash
npm run build
# Deploy the `dist/` directory to your hosting provider
```

## 🎨 Customization

### Colors and Typography

Edit `src/styles/_variables.scss` to customize:
- Color palette
- Font families
- Spacing scale
- Breakpoints

### Layout

Modify layouts in `src/layouts/` for different page structures.

## 📄 License

MIT License - feel free to use this as a starting point for your own technical blog.

## 🙏 Credits

- [Astro](https://astro.build) - Static site generator
- [MDX](https://mdxjs.com) - Markdown + JSX
- [Shiki](https://shiki.matsu.io) - Syntax highlighting
- [KaTeX](https://katex.org) - Math rendering
