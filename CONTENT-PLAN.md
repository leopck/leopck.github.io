# Content Improvement Plan — Fridays with Faraday (Revised)

## Guiding Principles

Every post must answer:
1. **What problem does this solve?** — the production pain that created the need
2. **What are the alternatives?** — design space, tradeoffs, why practitioners choose this over that
3. **How does it work underneath?** — not API-level but hardware/kernel/systems-level
4. **What are the real numbers?** — profiling data, memory breakdowns, latency measurements
5. **When should you NOT use it?** — failure modes, overhead, edge cases
6. **What does production look like?** — deployment considerations, operational gotchas

**Target**: Every post should be **4,000-8,000+ words**. Current average is ~1,100 words.

---

## ALL POSTS — Organized by Domain

### A. LLM INFERENCE FUNDAMENTALS (12 posts → consolidate to 8)

| # | Current File | Words | Action | Depth Improvements Needed |
|---|-------------|-------|--------|--------------------------|
| 1 | `llm-inference-basics-2019` | 1,085 | **REWRITE** | Thin intro. Must add: the prefill-decode split, why decode is memory-bandwidth-bound (roofline), arithmetic intensity analysis, batch size effects on compute vs memory boundedness, real torch profiler traces |
| 2 | `llm-prefill-optimization-2019` | 788 | **REWRITE** | Barely a post. Must add: chunked prefill, prefill compute profile (GEMM-bound), flash attention in prefill, prompt caching, prefill-decode interference, TTFT optimization strategies |
| 3 | `batch-processing-llm-optimization-2019` | 1,119 | **REWRITE** | Missing: continuous batching vs static batching deep comparison, padding waste analysis, in-flight batching, iteration-level scheduling, vLLM/SGLang scheduler internals |
| 4 | `llm-request-scheduling-batching-2020` | 727 | **MERGE into #3** | Overlaps with batch processing. Combine into one comprehensive scheduling post |
| 5 | `decoding-performance-beam-vs-sampling-2020` | 849 | **REWRITE** | Must add: nucleus sampling implementation details, temperature/top-p interaction, structured output (grammar-guided decoding), real latency measurements per strategy, KV cache impact of beam search |
| 6 | `kv-cache-optimization-llm-2019` | 1,253 | **REWRITE** | Must add: exact memory math for popular models (Llama 3 70B, 405B), paged attention deep dive, KV cache compression (eviction policies, H2O, attention sinks), quantized KV cache tradeoffs |
| 7 | `kv-cache-allocator-memory-pool-2020` | 761 | **MERGE into #6** | Overlaps with KV cache optimization. Fold allocator details into main KV cache post |
| 8 | `quantization-llm-performance-2019` | 919 | **REWRITE** | Must add: GPTQ vs AWQ vs SqueezeLLM comparison, W4A16 vs W8A8 vs W4A4, calibration methodology, per-channel vs per-group granularity, hardware support matrix (INT4/INT8/FP8 by GPU), real perplexity tables |
| 9 | `speculative-decoding` | 952 | **REWRITE** | Must add: why it works (memory-bound decode ≈ free verification), Medusa/EAGLE self-draft, token tree verification, acceptance rate math, when it hurts (large batch), multi-token prediction (DeepSeek V3) |
| 10 | `llm-speculative-decoding-2020` | 808 | **MERGE into #9** | Duplicate of speculative-decoding. Keep best content, merge |
| 11 | `bert-gpt-architecture-performance-trade-offs-2019` | 1,361 | **REWRITE** | Outdated framing. Rewrite as "encoder vs decoder architectures: why did decoders win?" Add: bidirectional vs causal attention tradeoffs, why GPT-style won for generation, encoder-decoder for translation/T5, modern hybrid approaches |
| 12 | `feature-showcase` | — | **DELETE** | Demo page, not content |

### B. ATTENTION & TRANSFORMERS (9 posts → consolidate to 7)

| # | Current File | Words | Action | Depth Improvements Needed |
|---|-------------|-------|--------|--------------------------|
| 13 | `transformer-attention-mechanism-2019` | 1,063 | **REWRITE** | Foundation post but thin. Must add: attention as database lookup analogy, QKV projection purpose, multi-head rationale (subspace diversity), O(n²) memory wall, causal masking mechanics, real memory profiling |
| 14 | `transformer-architecture-analysis-2020` | 1,045 | **MERGE into #13** | Overlaps. Combine into comprehensive transformer post |
| 15 | `attention-variants-mha-mqa-gqa` | 1,696 | **REWRITE** | Better than most but must add: MLA (DeepSeek V2/V3) with KV latent compression, decision framework ("when to pick what"), memory math at 70B/405B scale, CUDA kernel differences between variants, production deployment data |
| 16 | `grouped-query-attention` | 1,009 | **MERGE into #15** | GQA-specific — fold into the comprehensive attention variants post |
| 17 | `attention-performance-analysis-2019` | 1,130 | **MERGE into #13 or #15** | Performance analysis of attention — integrate into the foundation or variants post |
| 18 | `alibi-rotary-embeddings-performance-comparison-2020` | 966 | **REWRITE as unified position encoding post** | Must add: learned embeddings (GPT-2), sinusoidal (original transformer), ALiBi, RoPE — why each was created, mathematical foundations, hardware implications of each |
| 19 | `rope-embeddings-long-context` | 986 | **MERGE into #18** | RoPE-specific. Combine into unified position encoding post. Add: NTK-aware scaling math, YaRN, Llama 3.1 128K extension, attention sinks, StreamingLLM |
| 20 | `flashattention-memory-hierarchy` | 1,622 | **REWRITE** | Best attention post but still needs: FlashAttention-3 (Hopper WGMMA, async), FA1 vs FA2 vs FA3 comparison table, when FA is slower (short sequences), tiling parameter selection, integration with GQA/MQA kernels |
| 21 | `sparse-attention-mechanisms-efficiency-analysis-2020` | 6,011 | **REWRITE** | Long but shallow. Must add: why sparse attention lost to FlashAttention in practice, sliding window attention (Mistral), local+global patterns, BigBird/Longformer comparison with real numbers, when sparse still wins |

### C. CUDA & GPU PROGRAMMING (16 posts → consolidate to 11)

| # | Current File | Words | Action | Depth Improvements Needed |
|---|-------------|-------|--------|--------------------------|
| 22 | `gpu-memory-hierarchy-2019` | 1,330 | **REWRITE** | Foundation post. Must add: actual bandwidth measurements per level with profiling, register pressure vs occupancy tradeoff with real kernels, L1/L2 cache behavior differences across architectures, memory coalescing deep dive |
| 23 | `gpu-shared-memory-optimization-2019` | 1,200 | **MERGE into #22** | Shared memory is part of memory hierarchy. Integrate bank conflict analysis, padding techniques, async copy (cp.async) |
| 24 | `gpu-memory-bandwidth-optimization-2020` | 1,061 | **MERGE into #22** | Memory bandwidth optimization belongs in memory hierarchy post |
| 25 | `gpu-tensor-core-optimization-2019` | 901 | **REWRITE** | Must add: WMMA vs MMA vs WGMMA progression, tensor core data flow, how CUTLASS maps GEMM to tensor cores, FP8 tensor cores (Hopper), structured sparsity on Ampere, real TFLOPS measurements |
| 26 | `cuda-warp-level-optimization-2019` | 1,290 | **REWRITE** | Must add: warp shuffle patterns with real use cases, cooperative groups, warp-level primitives for reductions/scans/vote, how FlashAttention uses warp-level ops, PTXAS output analysis |
| 27 | `cuda-warp-occupancy-latency-hiding-2020` | 1,209 | **MERGE into #26** | Occupancy and warp scheduling belong together. Combine into comprehensive warp post |
| 28 | `cuda-kernel-optimization` | 1,002 | **REWRITE** | Must add: systematic optimization methodology (roofline → bottleneck identification → targeted fix), memory coalescing patterns, instruction-level parallelism, nsight compute workflow |
| 29 | `cuda-kernel-optimization-techniques-2019` | 2,001 | **MERGE into #28** | Duplicate. Keep best content |
| 30 | `cuda-kernel-fusion-memory-traffic-2020` | 634 | **REWRITE** | Barely exists. Must cover: WHY fusion (launch overhead + memory traffic), fusion patterns (elementwise, reduction, attention), Triton fusion, torch.compile/inductor, TensorRT fusion passes, real before/after profiling |
| 31 | `cuda-streams-overlap-pcie-2020` | 864 | **REWRITE** | Must add: async memcpy with compute overlap, how to profile overlap (nsight systems timeline), multi-stream patterns, CUDA events for timing, PCIe vs NVLink bandwidth reality |
| 32 | `cuda-graphs-inference` | 1,054 | **REWRITE** | Must add: why launch overhead matters for LLM decode (many small kernels), CUDA graph capture limitations (static shapes), vLLM's graph caching strategy, memory overhead, when graphs hurt |
| 33 | `cuda-graphs-inference-startup-latency-2020` | 614 | **MERGE into #32** | Duplicate. Combine |
| 34 | `cuda-unified-memory-performance-ai-workloads-2019` | 2,335 | **REWRITE** | Must add: when unified memory wins vs explicit transfers, page fault overhead measurement, prefetch strategies, HMM (heterogeneous memory management), real profiling of page migration |
| 35 | `roofline-gpu-kernel-optimization-2020` | 708 | **REWRITE** | Must be the definitive roofline post. Add: how to generate roofline plots with nsight, operational intensity calculation for real kernels, how to read nsight compute roofline, GEMM vs attention on roofline, memory-bound vs compute-bound decision |
| 36 | `multi-gpu-data-vs-model-parallel-2020` | 787 | **REWRITE** | Must add: data parallelism (DDP, FSDP, ZeRO stages), tensor parallelism (Megatron column/row split), pipeline parallelism (1F1B, interleaved, DualPipe), expert parallelism, context parallelism, sequence parallelism — when to use each combination |
| 37 | `gaudi2-memory-optimization` | 1,018 | **REWRITE** | Must add: Gaudi2 vs A100 vs H100 architecture comparison, graph compiler vs CUDA model, HBM vs SRAM trade-offs, when to choose Gaudi vs NVIDIA, real benchmark comparisons |

### D. vLLM & SERVING (4 posts → keep 4, deepen all)

| # | Current File | Words | Action | Depth Improvements Needed |
|---|-------------|-------|--------|--------------------------|
| 38 | `vllm-pagedattention-introduction-2020` | 805 | **REWRITE** | Must add: the fragmentation problem with numbers (68% waste), page table design, block allocation (O(1) stack), copy-on-write for beam search, how block mapping adds indirection cost |
| 39 | `vllm-pagedattention-memory-analysis` | 1,331 | **REWRITE** | Must add: block size selection analysis (16 vs 32 vs 64 tokens), internal vs external fragmentation math, L2 cache hit rate impact, memory watermark tuning, profiling methodology |
| 40 | `continuous-batching-implementation` | 773 | **REWRITE** | Must add: iteration-level scheduling internals, prefill-decode interleaving, preemption strategies (swap vs recompute), priority scheduling, multi-LoRA batching, real throughput curves |
| 41 | `request-routing-llm-inference` | 979 | **REWRITE** | Must add: load balancing algorithms (least-connections, prefix-aware), session affinity for KV cache reuse, disaggregated routing (prefill vs decode pools), autoscaling signals, real latency percentile data |

### E. DISTRIBUTED TRAINING & SYSTEMS (8 posts → consolidate to 6)

| # | Current File | Words | Action | Depth Improvements Needed |
|---|-------------|-------|--------|--------------------------|
| 42 | `tensor-parallelism-allreduce` | 1,248 | **REWRITE** | Must add: ring all-reduce vs tree all-reduce, NVLink topology effects, NCCL internals, Megatron column/row splitting math, sequence parallelism, context parallelism (ring attention) |
| 43 | `deepspeed-zero-memory-optimization-performance-2019` | 3,769 | **REWRITE** | Long but shallow. Must add: ZeRO-1/2/3 with exact memory math, FSDP comparison, when ZeRO-3 vs FSDP, communication volume analysis, real training throughput at different ZeRO stages |
| 44 | `gradient-compression-distributed-training-2019` | 3,042 | **REWRITE** | Must add: why gradient compression lost to ZeRO/FSDP in practice, PowerSGD, 1-bit Adam, when compression still wins (cross-datacenter), real convergence plots |
| 45 | `gpipe-pipedream-pipeline-parallelism-performance-analysis-2019` | 2,603 | **REWRITE** | Must add: 1F1B schedule, interleaved pipeline (Megatron), DualPipe (DeepSeek V3), pipeline bubble analysis with real numbers, memory vs bubble tradeoff, virtual pipeline stages |
| 46 | `nvidia-nccl-performance-tuning-multi-gpu-training-2020` | 4,304 | **REWRITE** | Must add: NCCL algorithm selection (ring vs tree vs collnet), NVSwitch topology detection, tuning environment variables with real impact, IB vs RoCE performance, SHARP/in-network computing |
| 47 | `mixed-precision-training-fp16-fp32-performance-analysis-2019` | 1,919 | **REWRITE** | Must add: BF16 vs FP16 (why BF16 won), FP8 training (Hopper), loss scaling deep dive, when mixed precision fails, Transformer Engine integration, real training curves FP32 vs BF16 vs FP8 |

### F. MCU & EMBEDDED (18 posts → keep all, deepen)

All MCU posts need the same pattern: explain the hardware WHY, show register-level details, provide real measurements, compare against alternatives.

| # | Current File | Words | Action | Key Improvements |
|---|-------------|-------|--------|-----------------|
| 48 | `esp32-power-management-basics-2019` | 915 | **REWRITE** | Add: power domain architecture, modem/light/deep sleep comparison with REAL current measurements, RTC peripheral power draw, battery life calculator with actual duty cycle math |
| 49 | `esp32-wifi-power-analysis-2019` | 1,601 | **REWRITE** | Add: WiFi state machine power profile, DTIM interval optimization, static IP vs DHCP power difference, WiFi vs BLE power comparison, REAL scope measurements |
| 50 | `esp32-sub-10ua-deep-sleep` | 1,234 | **REWRITE** | Add: every leakage source enumerated, GPIO isolation techniques, RTC domain configuration, REAL oscilloscope traces showing sub-10uA achievement |
| 51 | `esp32-rtc-memory-optimization-2019` | 1,217 | **REWRITE** | Add: RTC fast vs slow memory, data persistence across sleep, boot time optimization, REAL measurements of wake+process+sleep cycle |
| 52 | `esp32-cpu-frequency-scaling-2019` | 711 | **REWRITE** | Add: DVFS implementation, dynamic frequency/voltage relationships, energy-per-task analysis at different frequencies, thermal throttling |
| 53 | `esp32-adc-performance-optimization-2019` | 1,067 | **REWRITE** | Add: ADC nonlinearity characterization, calibration methodology, oversampling math, DMA-based continuous sampling, noise floor analysis |
| 54 | `esp32-spi-dma-throughput-2020` | 573 | **REWRITE** | Barely exists. Add: SPI mode selection, DMA descriptor chains, bus contention, real throughput at different frequencies, display driver optimization |
| 55 | `esp32-i2c-optimization-latency-throughput-2020` | 828 | **REWRITE** | Add: I2C stretching analysis, multi-device bus sharing, fast mode plus, when to prefer SPI over I2C, real bus analyzer captures |
| 56 | `esp32-ulp-coprocessor-optimization-2020` | 752 | **REWRITE** | Add: ULP instruction set limitations, REAL power comparison ULP vs main CPU, sensor polling patterns, wakeup trigger optimization |
| 57 | `stm32-dma-fundamentals-2019` | 955 | **REWRITE** | Add: DMA controller architecture, request mapping, burst mode, FIFO threshold tuning, priority arbitration, REAL throughput measurements |
| 58 | `stm32-dma-double-buffering-real-time-2020` | 860 | **REWRITE** | Add: circular vs normal mode tradeoffs, half-transfer interrupt patterns, ping-pong buffer implementation, real-time audio/ADC use case with latency measurements |
| 59 | `stm32-clock-optimization-2019` | 1,184 | **REWRITE** | Add: PLL configuration for different targets, run/sleep/stop mode power comparison, clock security system, REAL power measurements at different clock configs |
| 60 | `stm32-interrupt-optimization-2019` | 789 | **REWRITE** | Add: NVIC priority grouping, tail-chaining, late arrival optimization, interrupt latency measurement technique, when to use DMA vs interrupts |
| 61 | `stm32-timer-capture-jitter-2020` | 706 | **REWRITE** | Add: timer clock source selection, prescaler effects on resolution, input capture filter, jitter measurement methodology, REAL measurement results |
| 62 | `cortex-m4-dsp-audio` | 1,066 | **REWRITE** | Add: SIMD instruction set details, fixed-point vs float tradeoffs, FIR/IIR filter implementation, CMSIS-DSP library usage, real audio processing benchmarks |
| 63 | `cortex-m4-performance-optimization-2020` | 843 | **REWRITE** | Add: pipeline hazards, branch prediction on M4, TCM usage, cache-like behavior (ART accelerator on STM32), instruction timing analysis |
| 64 | `i2c-bus-optimization` | 956 | **MERGE into #55** | Overlaps with esp32-i2c post. Combine into one definitive I2C post |
| 65 | `cpu-cache-hierarchy-2019` | 1,061 | **REWRITE** | Reframe as "CPU vs GPU memory hierarchy comparison" — use it as a bridge post between MCU and GPU worlds |

### G. OTHER OPTIMIZATION TOPICS (11 posts → consolidate to 7)

| # | Current File | Words | Action | Key Improvements |
|---|-------------|-------|--------|-----------------|
| 66 | `memory-bandwidth-analysis-2019` | 1,081 | **MERGE into roofline #35** | Generic bandwidth content — fold into the roofline analysis post |
| 67 | `simd-optimization-basics-2019` | 1,041 | **REWRITE** | Reframe as "SIMD/vector processing: from ARM NEON to AVX-512 to GPU warps". Compare CPU SIMD vs GPU SIMT, show how the same algorithm maps to each |
| 68 | `ebpf-llm-profiling` | 1,257 | **REWRITE** | Must add: specific eBPF programs for LLM profiling (memory allocation tracking, GPU kernel timing), bpftrace examples, how to profile vLLM/SGLang in production, flamegraph interpretation |
| 69 | `gpu-memory-profiling` | 1,057 | **REWRITE** | Must add: nsight compute workflow, nsight systems timeline interpretation, torch.profiler integration, memory fragmentation detection, OOM debugging methodology |
| 70 | `tensorrt-optimization-llm-inference-2019` | 1,894 | **REWRITE** | Must add: TRT-LLM architecture, how TRT fuses ops, INT8/FP8 quantization in TRT, comparison with vLLM/SGLang, when TRT wins vs loses, real benchmark data |
| 71 | `onnx-runtime-performance-optimization-techniques-2020` | 4,967 | **REWRITE** | Long but generic. Must add: ONNX graph optimization passes, EP (execution provider) selection, quantization-aware training vs post-training, real model benchmarks |
| 72 | `model-pruning-techniques-performance-accuracy-trade-offs-2019` | 2,254 | **REWRITE** | Must add: structured vs unstructured pruning hardware implications, why pruning hasn't won in practice (hardware doesn't support sparse well), N:M sparsity on Ampere, SparseGPT |
| 73 | `neural-architecture-search-performance-optimization-2019` | 3,961 | **REWRITE** | Mostly irrelevant to modern LLM work. Reframe as "efficient architecture design: from NAS to scaling laws". Add: Chinchilla scaling, how DeepSeek chose 671B MoE vs dense, architecture search in modern context |
| 74 | `memory-mapping-large-model-loading-2020` | 6,548 | **REWRITE** | Long but lacks depth. Must add: safetensors format, mmap loading, tensor parallelism loading patterns, progressive loading for inference, real loading time benchmarks |
| 75 | `habana-gaudi-nvidia-v100-ai-training-performance-2020` | 4,883 | **REWRITE** | Outdated (V100 era). Rewrite as "AI accelerator landscape: H100 vs MI300X vs Gaudi3 vs TPU v5". Add: architecture comparison, software ecosystem maturity, real training benchmarks, TCO analysis |
| 76 | `turing-volta-architecture-ai-workloads-2020` | 4,950 | **REWRITE** | Outdated. Rewrite as "NVIDIA GPU architecture evolution: Volta→Ampere→Hopper→Blackwell". Focus on what changed at each generation and WHY (tensor cores, TMA, async everything, FP8) |
| 77 | `transformer-xl-long-range-attention-2019` | 1,158 | **REWRITE** | Reframe: "long-context architectures: from Transformer-XL to 1M token context". Add: segment-level recurrence (XL), sliding window (Mistral), ring attention, dynamic NTK scaling, Gemini 1M, how different engines handle long context |

---

## NEW POSTS TO ADD (7 posts)

| # | Topic | Target Words | Justification |
|---|-------|-------------|---------------|
| N1 | **Disaggregated Prefill-Decode Serving** | 6,000+ | Critical missing topic. Splitwise, DistServe, Mooncake, KV cache transfer |
| N2 | **DeepSeek V3 Architecture Deep Dive** | 7,000+ | Most important recent model. MLA, FP8 training, loss-free load balancing, DualPipe |
| N3 | **Compute-Communication Overlap** | 5,000+ | DeepEP, gradient overlap, pipeline scheduling, hook-based approaches |
| N4 | **Prefix Caching & Prompt Optimization** | 4,000+ | RadixAttention, automatic prefix caching, system prompt optimization |
| N5 | **Chunked Prefill & Iteration-Level Scheduling** | 4,000+ | Sarathi-Serve, TTFT vs TBT tradeoffs, token budget allocation |
| N6 | **FP8/FP4 Quantization for Training & Inference** | 5,000+ | E4M3 vs E5M2, Transformer Engine, W8A8, quality tables |
| N7 | **LLM Serving Engine Comparison** | 5,000+ | vLLM vs SGLang vs TRT-LLM vs TGI — decision matrix |

---

## POSTS TO DELETE OR MERGE (reduces count from 80 → ~60)

**Delete:**
- `feature-showcase.mdx`

**Merge pairs (keep one, fold other's content in):**
- `llm-request-scheduling-batching-2020` → into `batch-processing-llm-optimization`
- `llm-speculative-decoding-2020` → into `speculative-decoding`
- `kv-cache-allocator-memory-pool-2020` → into `kv-cache-optimization-llm`
- `grouped-query-attention` → into `attention-variants-mha-mqa-gqa`
- `attention-performance-analysis-2019` → into `transformer-attention-mechanism`
- `transformer-architecture-analysis-2020` → into `transformer-attention-mechanism`
- `rope-embeddings-long-context` → into `alibi-rotary-embeddings-performance-comparison`
- `cuda-kernel-optimization-techniques-2019` → into `cuda-kernel-optimization`
- `cuda-graphs-inference-startup-latency-2020` → into `cuda-graphs-inference`
- `cuda-warp-occupancy-latency-hiding-2020` → into `cuda-warp-level-optimization`
- `gpu-shared-memory-optimization-2019` → into `gpu-memory-hierarchy`
- `gpu-memory-bandwidth-optimization-2020` → into `gpu-memory-hierarchy`
- `memory-bandwidth-analysis-2019` → into `roofline-gpu-kernel-optimization`
- `i2c-bus-optimization` → into `esp32-i2c-optimization-latency-throughput`

**Final count: ~66 deep posts + 7 new = ~73 high-quality posts**

---

## FIX PUBLISH DATES

All posts use fake 2019/2020 dates (vLLM didn't exist until 2023, FlashAttention until 2022, DeepSeek V3 until 2024).

**Action**: Update all dates to 2025. Blog launches as new. No year suffixes in slugs for new/rewritten posts.

---

## IMPLEMENTATION ORDER

1. ~~Website bugs~~ ✅ Done (Giscus removed, PerfChart fixed)
2. **LLM inference posts** (A) — highest traffic, most visible
3. **Attention & transformer posts** (B) — core knowledge
4. **New posts** (N1-N7) — fill critical gaps
5. **CUDA/GPU posts** (C) — technical foundation
6. **Distributed training posts** (E) — systems depth
7. **vLLM & serving posts** (D) — practical deployment
8. **MCU posts** (F) — domain-specific
9. **Other optimization** (G) — cleanup and modernize
10. **Merges and deletes** — reduce bloat
11. **Date fixes** — chronological consistency

---

## SUCCESS CRITERIA

- [ ] Every post is 4,000+ words
- [ ] Every post opens with "the problem this solves"
- [ ] Every post has a "when NOT to use this" or "tradeoffs" section
- [ ] Every post has concrete numbers (not "faster" but "1.8x at batch=32")
- [ ] Every post compares alternatives with decision guidance
- [ ] 7 new posts cover 2024-2025 state of the art
- [ ] ~14 duplicate/thin posts merged, 1 deleted
- [ ] Zero build errors, zero rendering bugs
- [ ] All dates reflect actual publication timeline
