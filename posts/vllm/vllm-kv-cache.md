# vLLM Internals: Tracing vLLM's KV Cache Management

## Executive Summary: Why KV Cache is Central to vLLM

The key-value (KV) cache is the memory substrate that sustains autoregressive decoding in large language models. As tokens are generated, each layer’s attention mechanism reads previously computed keys and values, and appends new keys and values for the next step. If these tensors cannot be retained in fast memory, performance collapses under the cost of recomputation or transfer. vLLM’s central insight is to manage KV memory like an operating system manages virtual memory: divide it into fixed-size blocks, map logical token positions to physical pages on demand, and reuse or evict blocks with awareness of sequence identity and prefix sharing. This is the essence of PagedAttention.[^1]

In vLLM v0.6.0, the project disclosed that the dominant bottleneck to throughput on modern GPUs was CPU overhead, not GPU compute. The engine separated the API process from the inference engine, introduced multi-step scheduling, and overlapped output processing—all to keep the GPU fed and busy.[^2] Against that backdrop, KV cache allocation, evictions, and reuse become first-order concerns for tail latency and throughput: misconfigured memory budgets or inefficient block management translate into preemption, recomputation, and GPU stalls.

This deep dive analyzes KV cache internals at the code level and correlates them with observability signals. We begin with source-level structures and flows, then expand to eviction modes, preemption mechanics, and practical tracing and profiling methodologies that reveal how the KV cache behaves in production. We conclude with action-oriented tuning guidance and common failure modes.

### Key Takeaways

- PagedAttention treats KV cache as OS-like virtual memory: fixed-size blocks, logical-to-physical mapping, and non-contiguous storage to reduce fragmentation and enable sharing.[^1]
- vLLM v0.6.0 reduced CPU overhead by separating the API server and inference engine, adopting multi-step scheduling, and overlapping output processing; KV memory tuning amplifies these wins by reducing preemption and recomputation.[^2]
- The fastest way to see KV cache behavior is with low-overhead system tracing: brk/mmap/page-fault flame graphs for heap growth patterns, perf stat for counters, and developer-facing metrics in vLLM for preemption and utilization.[^3][^7]

---

## Architecture and Source Map: KV Cache in vLLM

vLLM’s serving stack is built around an OpenAI-compatible server process and a separate engine process. The engine encapsulates an executor, worker(s), model runner, scheduler, and cache engine. Configuration is grouped into Model, Cache, Scheduler, Parallel, and Device configurations, all coordinated by a top-level VllmConfig. This modularity allows the KV cache policy to be tuned independently from parallelism and scheduling decisions.[^4][^5][^14]

PagedAttention organizes KV tensors per sequence group by layer and head, but stores them as fixed-size blocks on the device. Logical token indices map to blocks; blocks can be allocated on demand, shared when prefixes match, and evicted under pressure. This design removes the need for static contiguous allocations sized for max sequence length and mitigates fragmentation.[^1]

To frame responsibilities, Table 1 summarizes core components and their relationship to KV cache.

To illustrate the architecture surface area and its cache touchpoints, Table 1 outlines the components that shape allocation, access, and eviction.

Table 1. Components and responsibilities relevant to KV cache

| Component            | Primary Responsibility                              | KV Cache Touchpoints                                                      |
|---------------------|------------------------------------------------------|---------------------------------------------------------------------------|
| API server (P0)     | Request validation, tokenization, streaming outputs  | No direct KV access; drives request flow that triggers cache allocation   |
| Engine core (P1)    | Orchestration, config wiring                         | Constructs Cache/Scheduler configs; receives metrics for preemption       |
| Executor            | Distributed execution selection                      | Chooses worker layout affecting per-GPU KV budgets                        |
| Worker              | Device-resident model execution                      | Holds device KV memory; performs block ops under runner’s instructions    |
| Model Runner        | Model execution and batch preparation                | Constructs attention inputs with block-based KV addressing                |
| Scheduler           | Batching and scheduling decisions                    | Decides when to preempt/recompute; sets prefill/decode budgets            |
| Cache Engine        | Block allocation/free and logical mapping            | Owns block tables; evicts under pressure; supports prefix reuse           |

Configuration drives KV behavior. The CacheConfig determines block size, utilization budget, and swap space; the SchedulerConfig defines batching budgets and preemption policy; the ParallelConfig decides how model weights are sharded, thereby changing the memory available for KV per GPU.[^4][^5]

Table 2 distills the most influential CacheConfig and SchedulerConfig fields.

Table 2. Key configuration fields influencing KV cache

| Config           | Field                         | Effect on KV Cache                                                                                               |
|------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------|
| CacheConfig      | block_size                    | Size of a KV block in tokens; coarser blocks reduce metadata overhead but increase internal fragmentation         |
| CacheConfig      | gpu_memory_utilization        | Fraction of GPU memory reserved for KV; higher values reduce preemption at the risk of OOM                       |
| CacheConfig      | swap_space                    | For SWAP preemption, CPU space to offload KV; trades recompute for transfer                                      |
| CacheConfig      | cache_dtype                   | Data type for KV storage (e.g., fp16); affects capacity and算术精度                                              |
| CacheConfig      | enable_prefix_caching         | Enables block sharing for identical prompt prefixes across requests                                               |
| SchedulerConfig  | max_num_batched_tokens        | Token budget per batch; too low increases scheduling overhead, too high penalizes decode ITL                     |
| SchedulerConfig  | max_num_seqs                  | Caps concurrent sequences; tighter cap reduces KV pressure                                                        |
| SchedulerConfig  | enable_chunked_prefill        | Splits large prefill; prioritizes decode to preserve ITL                                                          |
| SchedulerConfig  | preemption_mode               | RECOMPUTE (default) recomputes KV under pressure; SWAP offloads KV (slower in most cases)                        |
| ParallelConfig   | tensor/pipeline parallel size | Shards model weights; more shards free memory for KV but add synchronization                                      |

### Block-Based KV Storage and Logical Addressing

Under PagedAttention, each sequence is mapped to KV blocks of fixed token capacity. Logical addressing translates token positions to block IDs and offsets, allowing non-contiguous physical storage. Copy-on-write enables prefix sharing: if two requests share the same prompt prefix, they can reference the same blocks until a divergence point, saving memory and compute.[^1]

This approach mirrors virtual memory paging: sequences obtain blocks on demand, free them when finished, and suffer eviction only under pressure. The design reduces external fragmentation and enables aggressive reuse.

### Engine Initialization and Cache Setup

At startup, the engine initializes device context, constructs the CacheConfig (including gpu_memory_utilization and block_size), and performs warm-up runs that may capture CUDA graphs for subsequent steps. KV capacity is derived from available device memory after reserving space for activations and model weights; the CacheEngine then maintains block tables and allocates/free blocks as the Scheduler requests them.[^4][^5][^8]

---

## Tracing KV Cache Allocation, Eviction, and Reuse

Understanding allocation dynamics, eviction triggers, and reuse opportunities requires correlating code paths with OS-level signals. We recommend a three-pronged approach: brk/mmap/page-fault flame graphs for growth hotspots, perf stat for counter baselines, and vLLM metrics for preemption and utilization trends.[^3][^6][^7]

Table 3 summarizes how syscalls map to KV cache behaviors.

Table 3. Syscall-to-KV-cache behavior mapping

| Syscall | What it reveals about KV cache                          | Typical frequency under load                      | Low-overhead sampling command                                   |
|---------|----------------------------------------------------------|---------------------------------------------------|------------------------------------------------------------------|
| brk     | Heap expansion; growth from allocator activity           | Infrequent (often <1000/s in production)          | perf stat -e syscalls:sys_enter_brk -I 1000 -a                   |
| mmap    | Large mappings; arena extensions or explicit mappings    | Moderate; depends on allocator and usage          | perf record -e syscalls:sys_enter_mmap -ag -- sleep 60           |
| page-fault | Physical memory consumption when writes populate pages | Low; but informative for growth hotspots          | perf record -e page-faults -ag -- sleep 60                       |
| munmap  | Unmapping; confirms memory returned to OS                | Variable; often sparse for long-lived caches      | perf record -e syscalls:sys_enter_munmap -ag -- sleep 60         |

To focus the investigation, Table 4 lists developer-facing metrics and their diagnostic value.

Table 4. vLLM metrics for KV cache (monitor via /metrics)

| Metric                           | Meaning                                             | Diagnostic use-case                                      |
|----------------------------------|-----------------------------------------------------|----------------------------------------------------------|
| vllm_kv_cache_blocks             | Total KV cache blocks                               | Capacity planning and utilization                        |
| vllm_kv_cache_used_blocks        | Used blocks                                         | Utilization trend; preemption predictor                  |
| vllm_kv_cache_free_blocks        | Free blocks                                         | Headroom; risk of preemption                             |
| vllm_kv_cache_frag_ratio         | Fragmentation ratio                                 | Too many small free blocks may signal fragmentation      |
| vllm_preemption_count            | Preempted requests (by mode)                        | Tune utilization or scheduling budgets                   |
| vllm_swapped_kv_bytes            | Bytes swapped (if SWAP)                             | Transfer vs recompute trade-offs                         |

Note: Names and availability vary by version and build; use the /metrics endpoint to enumerate available series.[^7]

### Memory Profiling Workflow for KV Growth

We target three signals with increasing specificity:

- brk(): Lowest-overhead way to see heap expansion. Most allocators rarely shrink the break, so brk spikes strongly correlate with growth periods.
- mmap(): Allocators may use mmap for larger or isolated allocations; tracing helps identify arenas or large, persistent mappings.
- Page faults: While allocations commit virtual memory, writes to those pages cause minor faults; tracing them reveals the code paths that actually populate physical memory.

Collect stacks for each with perf and visualize as memory flame graphs. The workflow is standardized: record events with stacks, collapse to folded stacks, and render flame graphs using the memory color palette.[^3]

### Interpretation: From Syscall Patterns to Cache Policies

Under memory pressure, the scheduler may preempt sequences. In vLLM V1, the default preemption mode is RECOMPUTE: the engine drops KV for the victim sequences and recomputes the cache when those sequences resume. SWAP is also available but generally slower due to transfer costs, except in cases such as beam search where recompute is inapplicable.[^5][^8] Observing a rise in preemption counts alongside limited free blocks indicates that KV budgets are too tight; the remedy is to raise gpu_memory_utilization, reduce concurrency (max_num_seqs), or increase parallelism degrees to free device memory for KV.

---

## Deep Source Dive: BlockManager and Eviction Mechanics

Two types of allocation churn dominate KV behavior:

1) Prefill expansion: New prompts allocate blocks until their token length is cached.
2) Decode growth: Each step appends a small number of tokens; blocks grow incrementally and occasionally require new allocations.

BlockManager2 (or equivalent block-space manager) maintains per-sequence block tables, tracks referenced and allocated blocks, and enforces copy-on-write semantics for shared prefixes. Under pressure, it evicts blocks using a policy that balances fairness and capacity. vLLM’s scheduler cooperates with the cache engine by chunking prefill and prioritizing decode, limiting prefill’s ability to starve decode and keeping inter-token latency smooth.[^1][^8]

Table 5 summarizes preemption and eviction modes and their implications.

Table 5. Preemption and eviction modes

| Mode         | Mechanism                                    | Strengths                                    | Costs / Trade-offs                                         |
|--------------|-----------------------------------------------|----------------------------------------------|-------------------------------------------------------------|
| RECOMPUTE    | Drop KV; recompute on resume                  | Low overhead; scalable                        | CPU/GPU time for recompute; potential TTFT/TPOT penalties   |
| SWAP         | Offload KV to CPU swap space                  | Preserves KV; avoids recompute                | Transfer overhead often dominates; slower than recompute    |
| Evict blocks | Reclaim least valuable blocks                 | Protects throughput under pressure            | May increase fragmentation if policies mis-tuned            |
| Chunked prefill | Split prefill into chunks; schedule decode first | Improves ITL; overlaps memory-bound decode and compute-bound prefill | Requires careful budget tuning (max_num_batched_tokens)     |

### Code-Level Line-By-Line Outline

A code-level trace through a request’s life reveals three hotspots:

- SchedulerOutput creation: The scheduler decides which sequences to run, how many prefill tokens to admit, and whether to preempt. Budgets for max_num_batched_tokens bound prefill; decode is prioritized to protect ITL.[^5][^8]
- Block allocation paths: BlockManager allocates or references blocks for the scheduled tokens. With prefix caching enabled, identical prefixes reference shared blocks until divergence, avoiding redundant allocation and computation.[^4][^8]
- Attention kernel preparation: The model runner composes inputs using block-based KV addressing and invokes attention kernels. Efficient block addressing reduces overhead in the hot path.[^1]

These hotspots are where CPU overhead manifests—Python control structures and object orchestration around scheduling, batch preparation, and kernel launch. Multi-step scheduling amortizes this overhead across several steps, which, combined with asynchronous output processing, significantly reduces GPU idle time.[^2]

---

## Performance Counters and CPU Profiling Correlations

When GPUs are fast and models are optimized, CPUs become the bottleneck. The v0.6.0 analysis found large time shares consumed by the API server and scheduling, leaving the GPU underutilized on some workloads.[^2] On-CPU flame graphs derived from Linux perf samples reveal where those cycles go: often in scheduler loops, object manipulations, and data preparation. Off-CPU analysis shows synchronous output processing and blocking transfers that stall the pipeline.

Table 6 lists perf events that typically correlate with KV behavior.

Table 6. Key perf events and diagnostic targets

| Event                         | Why it matters for KV cache                                                                 |
|-------------------------------|----------------------------------------------------------------------------------------------|
| cycles, instructions, IPC     | Baseline CPU saturation and efficiency; validate multi-step scheduling savings               |
| stalled-cycles-frontend/backend | Decode often memory-bound; backend stalls can indicate GPU headroom or CPU->GPU orchestration |
| L1-dcache-loads/misses        | Hot loops in scheduling/prepare often show high loads; misses point to code/data layout issues |
| LLC-loads/misses              | Larger working sets (e.g., block tables) may stress cache                                     |
| page-faults                   | Correlates with memory growth; complements brk/mmap tracing                                   |
| context-switches              | High switch rates indicate contention or excessive preemption                                 |
| task-clock                    | Time spent on-CPU; compare with GPU time shares from internal counters                        |

### Flame Graph Workflow

A reproducible workflow:

- Record: perf record -F 99 -p <engine_pid> -g -- sleep 60
- Fold stacks: perf script | stackcollapse-perf.pl > out.folded
- Render: flamegraph.pl --title="vLLM on-CPU (99 Hz)" out.folded > cpu.svg

Repeat the process off-CPU (e.g., perf record -e sched:sched_switch -ag -- sleep 60) to visualize blocking paths. Filtering folded stacks by scheduler or output processing symbols isolates bottlenecks. Interpret widest boxes first—those are the hot code paths that most benefit from optimization or algorithmic changes.[^6][^11][^10]

---

## Memory Dump and GC Analysis: What to Look For

Python memory dumps and garbage collection logs help differentiate transient churn from persistent bloat:

- KV cache lives in device memory, but Python-side structures—block tables, sequence metadata, scheduler queues—live on the heap. Look for growth trends in these objects across workload phases.
- Fragmentation signals include many small free blocks alongside allocation failures; block_size tuning and chunked prefill settings can mitigate this.
- Short-lived Python objects associated with request orchestration dominate allocation rates. vLLM’s object cache reduces repeated allocations and deallocations, easing GC pressure and improving end-to-end throughput.[^2]

Table 7 provides a practical checklist.

Table 7. Memory dump checklist for vLLM services

| Category                 | What to check                                     | Tool / Signal                                         |
|-------------------------|----------------------------------------------------|-------------------------------------------------------|
| Block tables            | Growth rate vs. number of sequences                | Heap snapshots; GC logs                               |
| Prefix sharing          | Shared block references under load                 | Cache engine counters                                 |
| Free lists              | Many tiny free blocks; fragmentation ratio rising  | vLLM metrics; block manager internals                 |
| Scheduler queues        | Persistent queue growth under overload             | Object counts; perf off-CPU                           |
| Object churn            | High alloc/free rates in orchestration layers      | Python tracers; object cache hit rate                 |

---

## Actionable Tuning Guidance

Tuning the KV cache is the highest-leverage way to reduce preemption and keep decoders fed. Combine Cache and Scheduler settings with parallelism to maximize free blocks and reduce churn.

Table 8. KV tuning cheat sheet

| Symptom                                   | Likely cause                          | Knob(s)                                  | Expected effect                                      |
|-------------------------------------------|---------------------------------------|------------------------------------------|------------------------------------------------------|
| Rising preemption counts                   | KV budget too tight                   | gpu_memory_utilization ↑                 | More free blocks; fewer preemptions                  |
| High TTFT at low QPS with multi-step       | Scheduling stuck in long prefill runs | num-scheduler-steps ↓                    | Lower TTFT; may reduce throughput at high load       |
| Decode ITL jitter                          | Prefill hogging budget                 | enable_chunked_prefill (on), max_num_batched_tokens ↓ | Decode prioritized; smoother ITL               |
| Frequent small allocations and churn       | Block size too small                  | block_size ↑                             | Less metadata, fewer allocation calls                |
| OOM during prefill                         | Insufficient free memory               | max_num_seqs ↓; tensor/pipeline parallel ↑ | Fewer concurrent sequences; more KV headroom    |
| High KV fragmentation ratio                | Block size mismatch to workload        | block_size tuning; prefix caching on     | Better block reuse; reduced external fragmentation   |
| Transfer-dominated stalls                  | SWAP overuse                          | preemption_mode=RECOMPUTE                | Avoid slow offload; recompute instead                |

### Observability-Driven Tuning Loop

Establish baselines with perf stat and vLLM’s /metrics. Then iterate:

1) Raise gpu_memory_utilization until free blocks remain stable under peak concurrency.  
2) Adjust max_num_batched_tokens and enable_chunked_prefill to protect ITL.  
3) If preemption persists, reduce concurrency (max_num_seqs) or increase parallelism degrees to carve out KV space.  
4) Validate changes with perf stat counters and flame graphs to confirm reduced CPU contention and smoother GPU utilization.[^5][^7][^10]

---

## Appendices

### Glossary of KV-Cache-Related Terms

- Block: A fixed-size segment of device memory used to store KV tokens for one or more sequences.  
- Page: Synonymous with block in the PagedAttention context; not to be confused with OS pages.  
- Prefill: The phase that processes prompt tokens and populates the KV cache.  
- Decode: The autoregressive phase that appends one or a few tokens per step and reads KV.  
- Preemption: Evicting or offloading a sequence’s KV to make room for others under pressure.  
- RECOMPUTE vs. SWAP: RECOMPUTE drops KV and recomputes later; SWAP offloads KV to CPU memory.  
- ITL vs. TPOT vs. TTFT: Inter-token latency (time between output tokens), time per output token, and time to first token.

### Reproducing the Tracing Workflows

- CPU profiling: perf record -F 99 -p <PID> -g -- sleep 60; perf report; generate CPU flame graphs.  
- Syscall tracing: perf trace -p <PID>; or perf record -e syscalls:* -ag; then filter by brk/mmap.  
- Memory growth flame graphs: perf record -e syscalls:sys_enter_brk -ag; perf record -e page-faults -ag; collapse stacks and render with --color=mem.  
- vLLM metrics: Scrape /metrics; graph preemption counts and KV block usage to correlate with perf events and system load.[^10][^3][^7]

### Benchmark Notes and Reproducibility

The v0.6.0 performance analysis used ShareGPT and synthetic prefill-/decode-heavy datasets and reported TTFT/TPOT and throughput for Llama 3 8B/70B on A100/H100. Key optimizations included process separation, multi-step scheduling, asynchronous output processing, and an object cache, which cumulatively reduced CPU overhead and improved GPU utilization.[^2] Reproduce with similar workloads and consistent QPS to isolate CPU vs. GPU bottlenecks.

---

## Information Gaps

- Exact code paths and class names in the latest mainline can differ from v0.4.0-era descriptions; verification against the current repository is recommended.  
- Concrete strace/perf traces from representative vLLM runs are not included here; readers should capture and analyze their own workloads.  
- Developer-facing metrics may vary by version; confirm available series on the /metrics endpoint.  
- Precise preemption thresholds and heuristics can vary by release; use perf and metrics to characterize behavior in situ.

---

## References

[^1]: Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Yu, C. H., Gonzalez, J. E., Zhang, H., & Stoica, I. Efficient Memory Management for Large Language Model Serving with PagedAttention. arXiv:2309.06180. https://arxiv.org/pdf/2309.06180

[^2]: vLLM v0.6.0: 2.7x Throughput Improvement and 5x Latency Reduction. https://blog.vllm.ai/2024/09/05/perf-update.html

[^3]: Memory Leak (and Growth) Flame Graphs - Brendan Gregg. https://www.brendangregg.com/FlameGraphs/memoryflamegraphs.html

[^4]: Deep Dive into vLLM’s Architecture and Implementation (OpenAI-compatible). https://zerohertz.github.io/vllm-openai-1/

[^5]: Optimization and Tuning - vLLM. https://docs.vllm.ai/en/latest/configuration/optimization.html

[^6]: CPU Flame Graphs - Brendan Gregg. https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html

[^7]: vLLM Metrics and Observability (v0.9.0.1 docs). https://docs.vllm.ai/en/v0.9.0.1/design/v1/metrics.html

[^8]: Explaining the Source Code Behind the vLLM Fast Inference Engine. https://medium.com/@crclq2018/explaining-the-source-code-behind-the-vllm-fast-inference-engine-91429f54d1f7

[^9]: Getting Started with Flamegraphs - RHEL. https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/getting-started-with-flamegraphs_monitoring-and-managing-system-status-and-performance

[^10]: Linux perf Examples - Brendan Gregg. https://www.brendangregg.com/perf.html

[^11]: FlameGraph - Stack trace visualizer. https://github.com/brendangregg/FlameGraph

[^12]: vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention. https://blog.vllm.ai/2023/06/20/vllm.html

[^13]: vllm-project/vllm - GitHub. https://github.com/vllm-project/vllm

[^14]: OpenAI-Compatible Server (v0.9.0.1). https://docs.vllm.ai/en/v0.9.0.1/serving/openai_compatible_server.html