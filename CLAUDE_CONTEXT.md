# CLAUDE_CONTEXT.md — Persistent Project Memory

> Last updated: 2025-03-22 (Complete: 196 posts, 9 series, all reviewer-validated)

---

## Project Overview

**Fridays with Faraday** — a comprehensive technical blog covering LLM architecture, inference optimization, GPU programming, distributed training, and embedded systems. Built with Astro + MDX, deployed via GitHub Pages.

- **Repo**: `leopck/leopck.github.io`
- **URL**: https://fridayswithfaraday.com
- **Author**: Stanley Phoong (`stanley-phoong` in content schema)

---

## Current Stats (2025-03-22)

| Metric | Value |
|--------|-------|
| Total posts | **196** |
| Average words per post | **~4,600** |
| Total words | **~890K** |
| Series | **9 series, 143 posts in series** |
| Build pages | **~200** |
| Build errors | **Zero** |
| Reviewer Agent status | **All 9 series PASS** |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Astro 4.15 | Static site generator, MDX support |
| Content | MDX (Markdown + JSX) | 196 posts across 9+ domains |
| Styling | SCSS with variables | Dark theme, `src/styles/_variables.scss` |
| Math | KaTeX via remark-math + rehype-katex | Use `$...$` and `$$...$$` ONLY |
| Syntax highlighting | Shiki (built-in) | `langAlias: { cuda: 'cpp' }` in config |
| Sitemap | @astrojs/sitemap@3.2.1 | Pinned — newer versions crash |
| Sass | Modern compiler API | `api: 'modern-compiler'` in vite config |
| Deployment | GitHub Pages | Via `.github/workflows/deploy.yml` |
| Build requirement | `NODE_OPTIONS="--max-old-space-size=8192"` | Required for 196 posts (~3-5 min build) |

---

## The 9 Blog Series

### Series Overview

| Series | Posts | Verdict | Goal |
|--------|-------|---------|------|
| **Transformer Anatomy** | 36 | PASS | Build a transformer from scratch, single + multi-GPU |
| **Inference Optimization Timeline** | 41 | PASS | Build an LLM inference serving framework |
| **vLLM Internals** | 3 | PASS | Understand vLLM v0 codebase |
| **vLLM v1 & Omni Internals** | 13 | PASS | Understand vLLM v1 architecture + multimodal |
| **NVIDIA Dynamo & llm-d** | 14 | PASS | Build a KV-aware cluster router |
| **MoE Masterclass** | 4 | PASS | Implement a complete MoE layer |
| **Frontier Model Architectures** | 3 | PASS | Understand 2025 frontier model differences |
| **The Dataset Frontier** | 15 | PASS | Build a web-to-training-data pipeline |
| **Frontier Research 2025-2026** | 16 | PASS | Implement DPO/GRPO alignment |

### Series Infrastructure

- Schema fields: `series: z.string().optional()`, `seriesOrder: z.number().optional()` in `src/content/config.ts`
- Navigation: `src/components/SeriesNav.astro` renders prev/next + numbered parts list
- Index page: `src/pages/series/index.astro` shows all 9 series with post lists
- Metadata: `src/pages/series/index.astro` contains `seriesMeta` with icon, description, color per series

### Key Posts Per Series

**Transformer Anatomy** (36 posts, seriesOrder 1-39):
- Core: attention mechanism, tokenization, embeddings, position encoding, softmax, attention variants, normalization, residuals, FFN/SwiGLU, MoE, output head, loss function, capstone
- Training: gradient flow, weight init, training loop, LR schedules, DDP, mixed precision, data loading
- Advanced: dropout, attention masking, sparse attention, RoPE derivation, knowledge distillation, model merging, pruning, tensor decomposition, checkpoints, model sharding, MoD, MTP heads
- Gap fixes: inference engine (Part 38), tensor parallelism (Part 39)

**Inference Optimization Timeline** (41 posts, seriesOrder 0-39):
- Bridge: transformer fundamentals for systems engineers (Part 0)
- Core: inference basics, KV cache, quantization, FlashAttention, PagedAttention, continuous batching, speculative decoding, prefix caching, LoRA serving, disaggregated PD, constrained gen, Mamba, inference-time scaling, CPU inference, cost economics
- Advanced: model loading, GEMM throughput, kernel autotuning, attention kernel comparison, token pipeline, dynamic batching, memory pools, prefill/decode optimization, CUDA graphs, multi-model serving, structured output acceleration, VLM serving, long-context serving, profiling, FP8 inference, speculative v2, disaggregated v2, preemption/priority, autoscaling, distributed TP/PP, KV compression, video/audio serving, benchmarking methodology, 2026 inference stack

**vLLM v1 & Omni Internals** (13 posts):
- Block manager, disaggregated E/P/D/G, OmniConnector, unified scheduler, attention backends, rejection sampler, CUDA graph dispatcher, TP symmetric workers, structured output engine, prefix caching, multi-LoRA, profiling, speculative decoding, vision encoder

**NVIDIA Dynamo & llm-d** (14 posts):
- KV-aware routing, ModelExpress/NIXL, Planner/Grove/gang scheduling, KVBM multi-tier, llm-d declarative, fault tolerance, multi-model serving, multimodal routing, cost optimizer, Blackwell GB200, observability, vs SGLang, MoE expert routing, mini-router implementation

**MoE Masterclass** (4 posts):
- Gated layer from scratch, EP communication/ScMoE, MLA implementation, complete gating + load-balancing loss (gap fix)

**The Dataset Frontier** (15 posts):
- Synthetic data (Magpie/Nemotron), DCLM/FineWeb curation, agent simulation, reasoning traces, code curation, multilingual, instruction tuning, preference data, data mixing, evaluation benchmarks, contamination detection, data scaling law, HTML-to-clean pipeline

**Frontier Research 2025-2026** (16 posts):
- Reasoning scaling laws, Lightning Attention, PoT, test-time compute, self-improving systems, embodied AI, reward model engineering, DPO/KTO/ORPO, long-context 10M+, multimodal fusion, efficient fine-tuning, open problems 2026, hallucination, interpretability, GRPO complete algorithm (gap fix)

---

## MDX Components (`src/components/mdx/`)

| Component | Props | Notes |
|-----------|-------|-------|
| `Callout` | `type`, `title` | Types: info, warning, danger, tip, perf, success |
| `Benchmark` | `columns`, `rows`, `title`, `notes` | `rows` optional (defaults `[]`). Each row: `{ values: string[], highlight: boolean }` |
| `PerfChart` | `title`, `unit`, `type`, `data`, `chartData` | 3 formats: bar data, datasets, series |
| `MemoryLayout` | `title`, `description`, `regions`, `layout` | Dual mode: hex memory maps OR generic labeled blocks |
| `RegisterDiagram` | `name`, `address`, `description`, `bits`, `fields` | Dual mode: bit-fields OR generic field lists |
| `Theorem` | `title`, `type` | Types: Theorem, Lemma, Definition |
| `CodeCompare` | `beforeTitle`, `afterTitle` | Side-by-side code with slots |
| `DiagramContainer` | `title`, `description` | Generic wrapper |

---

## Gotchas & Lessons Learned

### MDX Parsing (CRITICAL — memorize these)

1. **Bare `<` and `>` in prose BREAK MDX** — Use `&lt;`/`&gt;` or words ("greater than"). This is the #1 build-breaking issue.
2. **`\(` and `\[` LaTeX delimiters BREAK MDX** — Always use `$...$` and `$$...$$`.
3. **Python type hints with brackets in code blocks CAN break MDX** — `list[dict]`, `set[str]` etc. inside fenced code blocks sometimes get parsed as JSX. Use plain types or `List`, `Dict` from typing.
4. **YAML tags that are numbers break frontmatter** — `tags: [moe, 2026]` fails because `2026` is parsed as number. Use `year-2026` instead.
5. **Dollar signs `$` in prose text are LaTeX delimiters** — `$10.00` starts math mode. Use `USD 10.00` in prose. Inside JSX prop strings they're fine.
6. **HTML tags in code blocks can break MDX** — `<html>`, `<nav>` etc. in ```html code blocks get parsed as JSX. Use ```text with bracket notation instead.
7. **Children-based component syntax doesn't work** — `<Benchmark>{[["a","b"]]}</Benchmark>` won't pass data. Must use `rows` prop.

### Build Issues

8. **Build requires 8GB Node memory at 196 posts** — `NODE_OPTIONS="--max-old-space-size=8192"` required. Build time: ~3-5 minutes.
9. **OneDrive causes transient `UNKNOWN: unknown error, read`** — Clear `.astro/` cache and retry.
10. **`@astrojs/sitemap` v3.7+ crashes** — Pinned to v3.2.1.
11. **Shiki `cuda` language** — `langAlias: { cuda: 'cpp' }` in config.
12. **Sass legacy API** — `api: 'modern-compiler'` in vite config.

### Content Schema

13. **Author is a reference** — `author: reference('authors')`. File: `src/content/authors/stanley-phoong.json`.
14. **Series fields** — `series: z.string().optional()`, `seriesOrder: z.number().optional()` — both must be set for SeriesNav to render.
15. **Prerequisites field** — `prerequisites: z.array(z.string()).optional()` — used in gap-fix posts to mark required prior reading.

---

## Reviewer Agent Process

The Reviewer Agent validates each series by reading all posts as a "senior engineer with zero LLM knowledge" and checking:

1. **COMPREHENSION GAPS**: Concepts used but not explained
2. **MISSING BRIDGES**: Prerequisites assumed between posts
3. **IMPLEMENTATION GAPS**: Could I build this from the description alone?
4. **ALTERNATIVES NOT ADDRESSED**: Why this approach and not another?

### Gap Fix History (2025-03-22)

| Gap | Series | Fix Post | Status |
|-----|--------|----------|--------|
| No inference engine | Transformer Anatomy | `transformer-anatomy-inference-engine-kv-cache-generation.mdx` (Part 38) | FIXED |
| No distributed training | Transformer Anatomy | `transformer-anatomy-tensor-parallelism-implementation.mdx` (Part 39) | FIXED |
| No bridge for systems engineers | Inference Timeline | `inference-timeline-transformer-fundamentals-for-systems.mdx` (Part 0) | FIXED |
| Gating code truncated | MoE Masterclass | `moe-masterclass-complete-gating-implementation.mdx` (Part 4) | FIXED |
| GRPO algorithm underspecified | Frontier Research | `frontier-research-grpo-algorithm-complete.mdx` (Part 15) | FIXED |

**Result: All 9 series PASS reviewer validation.**

---

## Key Implementations in the Blog

The blog contains **50+ runnable code implementations**:

| Implementation | Post | Language |
|---------------|------|----------|
| MLAAttention (DeepSeek MLA) | MoE Masterclass Part 3 | PyTorch |
| CompleteMoELayer (gating + balancing + capacity) | MoE Masterclass Part 4 | PyTorch |
| KVCache + generate() loop | Transformer Anatomy Part 38 | PyTorch |
| ColumnParallelLinear + RowParallelLinear (TP) | Transformer Anatomy Part 39 | PyTorch |
| KVBM multi-tier offloading | Dynamo Part 4 | Python |
| KV-aware router (500 lines) | Dynamo Part 14 | Python |
| DPO/KTO/ORPO loss functions | Frontier Research Part 8 | PyTorch |
| GRPO training loop | Frontier Research Part 15 | PyTorch |
| GPUSlabAllocator | Inference Timeline Part 22 | Python |
| ChunkedLightningAttention (O(n)) | Frontier Research Part 2 | PyTorch |
| MinHash LSH deduplication | Dataset Frontier Part 2 | Python |
| Synthetic data pipeline | Dataset Frontier Part 1 | Python |
| OmniConnector async lifecycle | vLLM v1 Part 3 | Python |
| TopologyGraph gang scheduling | Dynamo Part 3 | Python |
| LRScheduler (warmup + cosine + WSD) | Transformer Anatomy Part 19 | Python |
| Medusa/EAGLE speculative heads | Inference Timeline Part 31 | PyTorch |
| PRM beam search | Frontier Research Part 7 | Python |

---

## Content Evolution Timeline

| Date | Posts | Words | Key Milestone |
|------|-------|-------|--------------|
| Start | 80 | 88K | Shallow posts, 1,100 avg words |
| Phase 1 (overhaul) | 67 | 371K | All posts rewritten to 4K-8K words |
| Phase 2 (series) | 83 | 466K | 2 series created (Transformer Anatomy, Inference Timeline) |
| Phase 3 (expansion) | 102 | 524K | 5 more series (vLLM v1, Dynamo, MoE, Dataset, Research) |
| Phase 4 (L4 architect) | 137 | 676K | Level 4 Implementation Architect standard |
| Phase 5 (full targets) | 191 | 879K | All series targets hit or exceeded |
| Phase 6 (reviewer fixes) | **196** | **~890K** | All 5 critical gaps fixed, **9/9 series PASS** |

---

## Active TODO List

### Completed
- [x] All 9 series created and populated
- [x] Reviewer Agent validation — all series PASS
- [x] 5 critical reviewer gaps fixed
- [x] /series page created and working
- [x] Giscus removed (broken, needs GitHub Discussions enabled)
- [x] PerfChart supports all 3 data formats
- [x] Series infrastructure (SeriesNav, series frontmatter) fully operational

### Remaining (Low Priority)
- [ ] Enable Giscus comments (requires GitHub Discussions on repo)
- [ ] Fix npm audit vulnerabilities (9 reported)
- [ ] Add Pagefind search (`npx pagefind` build step needed)
- [ ] Add og:image generation for social cards
- [ ] Fix publish dates (many show 2019/2020 for 2023+ tech)
- [ ] Some MCU posts slightly below 4,000 word target
- [ ] 3 posts have shorter-than-ideal content due to Write tool truncation (DeepSeek V3, FlashAttention, MoE original)

---

## File Structure

```
src/
├── components/
│   ├── mdx/           # Callout, Benchmark, PerfChart, MemoryLayout, etc.
│   ├── interactive/   # CudaWarpVisualizer, RooflinePlot, Esp32PowerOptimizer
│   ├── Header.astro   # Nav with Posts/Categories/Series/About
│   ├── Footer.astro
│   ├── PostCard.astro
│   ├── PostMeta.astro
│   ├── RelatedPosts.astro
│   ├── AuthorBio.astro
│   ├── SeriesNav.astro  # Prev/next + numbered parts list
│   └── TableOfContents.astro
├── content/
│   ├── config.ts      # Zod schemas (series, seriesOrder, prerequisites fields)
│   ├── authors/       # stanley-phoong.json
│   └── posts/         # 196 MDX files
├── layouts/
│   ├── BaseLayout.astro  # HTML shell, meta tags, KaTeX CSS
│   └── PostLayout.astro  # Post page with TOC, SeriesNav, related posts
├── pages/
│   ├── index.astro          # Homepage
│   ├── about.astro
│   ├── series/index.astro   # Series listing page (all 9 series)
│   ├── posts/[slug].astro   # Dynamic post pages
│   ├── posts/index.astro    # All posts listing
│   ├── categories/          # Category pages
│   └── rss.xml.js
├── plugins/
│   └── rehype-custom-components.mjs
└── styles/
    ├── global.scss
    └── _variables.scss
```
