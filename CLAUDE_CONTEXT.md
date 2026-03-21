# CLAUDE_CONTEXT.md — Persistent Project Memory

> Last updated: 2025-03-21 (Phase 2: Series expansion complete)

---

## Project Overview

**Fridays with Faraday** — a technical blog covering systems optimization from bare-metal MCUs to large-scale LLM inference. Built with Astro + MDX, deployed via GitHub Pages.

- **Repo**: `leopck/leopck.github.io`
- **URL**: https://fridayswithfaraday.com
- **Author**: Stanley Phoong (`stanley-phoong` in content schema)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Astro 4.15 | Static site generator, MDX support |
| Content | MDX (Markdown + JSX) | 67 posts across 7 domains |
| Styling | SCSS with variables | Dark theme, `src/styles/_variables.scss` |
| Math | KaTeX via remark-math + rehype-katex | Use `$...$` and `$$...$$` ONLY (not `\(` `\[`) |
| Syntax highlighting | Shiki (built-in) | `langAlias: { cuda: 'cpp' }` in config |
| Sitemap | @astrojs/sitemap@3.2.1 | Pinned — newer versions crash |
| Sass | Modern compiler API | `api: 'modern-compiler'` in vite config |
| Deployment | GitHub Pages | Via `.github/workflows/deploy.yml` |

---

## Key Architecture Decisions

### MDX Components (`src/components/mdx/`)

| Component | Props | Notes |
|-----------|-------|-------|
| `Callout` | `type`, `title` | Types: info, warning, danger, tip, perf, **success** |
| `Benchmark` | `columns`, `rows`, `title`, `notes` | `rows` is optional (defaults `[]`). Each row: `{ values: string[], highlight: boolean }` |
| `PerfChart` | `title`, `unit`, `type`, `data`, `chartData` | **Supports 3 formats**: (1) bar: `data={[{label, value, color}]}`, (2) datasets: `data={{labels, datasets}}`, (3) series: `chartData={{labels, series}}` |
| `MemoryLayout` | `title`, `description`, `regions`, `layout` | **Dual mode**: `regions` for hex memory maps, `layout` for generic labeled blocks |
| `RegisterDiagram` | `name`, `address`, `description`, `bits`, `fields` | **Dual mode**: `bits` for register bit-fields, `fields` for generic field lists |
| `Theorem` | `title`, `type` | Types: Theorem, Lemma, Definition |
| `DiagramContainer` | `title`, `description` | Generic wrapper |
| `CodeCompare` | `beforeTitle`, `afterTitle` | Side-by-side code with slots `before`/`after` |

### Interactive Components (`src/components/interactive/`)

| Component | Notes |
|-----------|-------|
| `CudaWarpVisualizer` | Vanilla JS `is:inline` script — occupancy calculator |
| `Esp32PowerOptimizer` | Vanilla JS `is:inline` script — battery life calculator |
| `RooflinePlot` | Vanilla JS `is:inline` with canvas — roofline diagram |

**CRITICAL**: Interactive components must use `is:inline` scripts with vanilla JS. Astro does NOT support `import { onMount } from 'astro/micro'` or React-like `onChange` handlers. These were bugs we fixed.

---

## Gotchas & Lessons Learned

### MDX Parsing

1. **Bare `<` and `>` in prose break MDX** — JSX parser interprets them as tags. Use `&lt;`/`&gt;` or words like "greater than"/"less than".

2. **`\(` and `\[` LaTeX delimiters break MDX** — JS parser sees `\u` escape sequences. Always use `$...$` and `$$...$$`.

3. **Children-based component syntax doesn't work in Astro MDX** — `<Benchmark>{[["a","b"]]}` won't pass data as props. Must use explicit `rows` prop.

4. **`%` in JSX prop strings is fine** — `{ values: ["72%", "810 GB/s"] }` works. Only bare `<`/`>` in prose text breaks things.

### Build Issues

5. **OneDrive causes transient `UNKNOWN: unknown error, read`** — Clear `.astro/` cache and retry.

6. **`@astrojs/sitemap` v3.7+ crashes** — Pinned to v3.2.1. Don't upgrade without testing.

7. **Shiki doesn't know `cuda` language** — Added `langAlias: { cuda: 'cpp' }` in both `mdx.shikiConfig` and `markdown.shikiConfig`.

8. **Sass legacy JS API deprecation** — Fixed with `api: 'modern-compiler'` in vite SCSS preprocessor options.

9. **`rehype-pretty-code` was removed** — It conflicted with Astro's built-in Shiki. Astro handles highlighting natively via `shikiConfig`.

### Content Schema

10. **Author is a reference** — `author: reference('authors')` in content config. Author file: `src/content/authors/stanley-phoong.json`.

11. **Callout `type="success"` was missing** — Added to component + SCSS. Also added to `index.ts` export types.

12. **Giscus was broken** — GitHub Discussions not enabled on repo. Removed the script tag from `PostLayout.astro`.

---

## Content Status (as of 2025-03-21)

### Stats
- **67 posts** (down from 80 — 14 merged, 1 deleted, 4 new)
- **5,538 words average** (up from ~1,100)
- **61 of 67 at 4,000+ words**
- **371K total words**
- **Zero build errors**

### Domains
| Domain | Posts | Key Topics |
|--------|-------|-----------|
| LLM Inference | 12 | Prefill/decode, KV cache, speculative decoding, batching, scheduling |
| Attention/Transformers | 6 | MHA/MQA/GQA/MLA, RoPE/ALiBi, FlashAttention, sparse/long context |
| CUDA/GPU | 11 | Memory hierarchy, warps, kernel optimization, fusion, streams, graphs, tensor cores |
| vLLM/Serving | 4 | PagedAttention, continuous batching, request routing, engine comparison |
| Distributed Training | 6 | Data/tensor/pipeline/expert parallelism, ZeRO/FSDP, NCCL, overlap |
| MCU/Embedded | 17 | ESP32 (power, WiFi, ADC, SPI, I2C, ULP), STM32 (DMA, clocks, interrupts, timers), Cortex-M4 |
| Other Optimization | 11 | Quantization, mixed precision, pruning, roofline, profiling, accelerators |

### New Posts Added
1. `deepseek-v3-architecture-deep-dive.mdx` — MLA, MoE, FP8, DualPipe
2. `disaggregated-prefill-decode-serving.mdx` — Splitwise, DistServe, Mooncake
3. `compute-communication-overlap-distributed-training.mdx` — DeepEP, gradient overlap, pipeline scheduling
4. `llm-serving-engine-comparison.mdx` — vLLM vs SGLang vs TRT-LLM vs TGI

### Merged Posts (14 pairs)
- `grouped-query-attention` → into `attention-variants-mha-mqa-gqa`
- `rope-embeddings-long-context` → into `alibi-rotary-embeddings`
- `attention-performance-analysis` + `transformer-architecture-analysis` → into `transformer-attention-mechanism`
- `llm-speculative-decoding-2020` → into `speculative-decoding`
- `kv-cache-allocator-memory-pool` → into `kv-cache-optimization-llm`
- `batch-processing-llm-optimization` + `llm-request-scheduling-batching` → into `continuous-batching-implementation`
- `cuda-kernel-optimization-techniques` → into `cuda-kernel-optimization`
- `cuda-graphs-inference-startup-latency` → into `cuda-graphs-inference`
- `cuda-warp-occupancy-latency-hiding` → into `cuda-warp-level-optimization`
- `gpu-shared-memory-optimization` + `gpu-memory-bandwidth-optimization` → into `gpu-memory-hierarchy`
- `memory-bandwidth-analysis` → into `roofline-gpu-kernel-optimization`
- `tensor-parallelism-allreduce` → into `multi-gpu-data-vs-model-parallel`
- `vllm-pagedattention-memory-analysis` → into `vllm-pagedattention-introduction`
- `i2c-bus-optimization` → into `esp32-i2c-optimization-latency-throughput`

---

## Active TODO List

### High Priority
- [ ] Habana/Gaudi comparison post (`habana-gaudi-nvidia-v100-ai-training-performance-2020.mdx`) still has old content (4,883 words but not rewritten with new structure)
- [ ] GPU architecture evolution post (`turing-volta-architecture-ai-workloads-2020.mdx`) still has old content (4,950 words but not rewritten)
- [ ] DeepSeek V3 and MoE posts are shorter than target due to Write tool truncation (~1,700 and ~1,800 words vs 7,000+ target)
- [ ] Fix all publish dates — many still show 2019/2020 (technologies like vLLM, FlashAttention didn't exist then)

### Medium Priority
- [ ] Add prefix caching post (RadixAttention, SGLang — was in plan but not created)
- [ ] Add FP8/FP4 quantization dedicated post (partially covered in mixed-precision, deserves its own)
- [ ] Enable Giscus comments (requires enabling GitHub Discussions on repo first)
- [ ] Fix npm audit vulnerabilities (9 reported by GitHub)
- [ ] Add search functionality (Pagefind referenced in Header but `/_pagefind/` doesn't exist — need `npx pagefind` build step)

### Low Priority
- [ ] Add og:image generation for social cards
- [ ] Add favicon.svg (referenced in BaseLayout but may not exist)
- [ ] Consider adding a /series page (referenced in Header nav but may not have a page)
- [ ] Update CONTENT-PLAN.md to reflect completed work
- [ ] `cortex-m4-dsp-audio` (3,796 words) and `stm32-timer-capture-jitter` (3,950 words) slightly below 4,000 target

---

## File Structure Quick Reference

```
src/
├── components/
│   ├── mdx/           # Callout, Benchmark, PerfChart, etc.
│   ├── interactive/   # CudaWarpVisualizer, RooflinePlot, Esp32PowerOptimizer
│   ├── Header.astro   # Nav + search modal + mobile menu
│   ├── Footer.astro
│   ├── PostCard.astro
│   ├── PostMeta.astro
│   ├── RelatedPosts.astro
│   ├── AuthorBio.astro
│   ├── SeriesNav.astro
│   └── TableOfContents.astro
├── content/
│   ├── config.ts      # Zod schemas for posts + authors collections
│   ├── authors/       # stanley-phoong.json
│   └── posts/         # 67 MDX files
├── layouts/
│   ├── BaseLayout.astro  # HTML shell, meta tags, KaTeX CSS, scroll indicator
│   └── PostLayout.astro  # Post page with TOC, related posts, author bio
├── pages/
│   ├── index.astro          # Homepage
│   ├── about.astro
│   ├── posts/[slug].astro   # Dynamic post pages (registers MDX components)
│   ├── posts/index.astro    # All posts listing
│   ├── categories/          # Category pages
│   └── rss.xml.js
├── plugins/
│   └── rehype-custom-components.mjs  # Custom rehype for code block styling
└── styles/
    ├── global.scss
    └── _variables.scss   # Design system tokens, mixins, breakpoints
```
