# Tracing GPU Memory Bandwidth in Transformer Models

## Executive Summary

Transformer inference at scale is dominated by memory traffic, not floating-point arithmetic. Across a broad set of modern models and batch sizes, decode-phase attention kernels exhibit arithmetic intensities clustered around 0.5–1.0 operations per byte— squarely in the memory-bound regime. Profiling evidence from large-batch runs shows DRAM read utilization frequently hitting 60–80% while compute warps in flight remain low, and the majority of cycles in attention kernels are stalled waiting on data access. These findings are consistent across model families (OPT, Llama 2) and are robust to the choice of attention kernel implementation, including FlashAttention variants. The implication is straightforward: throughput gains in large-batch serving come from reducing bytes moved, not from increasing FLOPs. In this deep dive, we instrument and analyze transformer kernels using a fully reproducible workflow—Nsight Compute for GPU metrics, CUDA-GDB and coredumps for fault isolation, and flame-graph-style visualization for pattern discovery—culminating in actionable guidance on batching, KV-cache management, and kernel tuning.

## Scope and Methodology

We target large language model inference under online and offline serving conditions, focusing on the decode phase where KV-cache reuse drives memory behavior and where concurrency strategies (batching, replication) materially impact GPU resource use. Our goals are to quantify and explain why transformer attention remains memory-bound, to separate compute from memory stalls, and to show how profiling should inform both system-level scheduling decisions and kernel-level tuning.

- Workloads. We analyze decoder-only models including OPT and Llama families, covering the phases most relevant to production serving: prefill (one pass over the input prompt) and decode (token-by-token generation). We emphasize large-batch behavior and decode-phase dominance (>95% of total inference time at max batch), consistent with recent profiling-driven studies on vLLM-class stacks.
- Tooling strategy.
  - Nsight Compute CLI (ncu) for kernel-level metrics, including memory workload sections (dram__bytes_read.sum, dram__bytes_write.sum), cache hit rates (lts__t_sector_hit_rate.pct), occupancy, and warp stall breakdowns. We use kernel filtering and NVTX ranges to isolate attention kernels across decode, and replay modes to collect complete sections with controlled overhead.[^4][^5]
  - CUDA-GDB and GPU coredumps for precise fault attribution (illegal memory access, IMA) and correlation to kernels and launch coordinates. Coredumps allow inspection of SM, warp, lane state, program counter, and kernel arguments, and are indispensable for isolating failures within CUDA Graphs.[^3][^6]
  - Linux perf for CPU-side context: memory access sampling (perf mem), cache and TLB behavior, minor-fault sampling for RSS growth, and scheduler traces (perf sched). These help correlate application-level scheduling, page faults, and numa effects with GPU workload characterization.[^2]
- Output and analysis. We synthesize per-kernel metrics into a decision framework: use ncu sections for GPU hotspots, map stall reasons to likely mitigations, corroborate CPU scheduling and memory behavior with perf, and visualize cost with flame-graph-derived techniques where supported.[^7]

To orient the reader to the instrumentation landscape and trade-offs, we summarize the toolchain below.

To illustrate this point, the following table contrasts the principal profiling and debugging tools used in this study.

| Tool | Focus | Mode | Key metrics/features | Typical use in LLM inference |
|---|---|---|---|---|
| Nsight Compute CLI (ncu) | Kernel-level GPU profiling | Launch/attach; kernel filtering; NVTX ranges; replay | MemoryWorkload sections (DRAM bytes, L2 hit), warp stall breakdowns, occupancy, SM efficiency | Attribute cycles to memory vs compute, quantify DRAM utilization and cache hit rates, isolate attention kernel behavior under batch scaling[^4][^5] |
| CUDA-GDB + GPU coredumps | Fault isolation and live debugging | Interactive; core-file analysis | Exception type, SM/warp/lane focus, PC, kernel args; register inspection; disassembly | Pinpoint IMA in fused kernels or Triton-generated kernels; correlate failures with launch configurations and memory access patterns[^3][^6] |
| Linux perf (stat/record/mem/sched) | CPU-side system profiling | System-wide or per-PID; sampling and tracing | Cache/misses, TLB, page faults; syscalls; context switches; scheduler maps | Correlate CPU scheduling and memory subsystem behavior with GPU bursts; identify userspace allocation hotspots and numa effects[^2] |
| AI Flame Graphs (Intel) | Full-stack visualization | Off-CPU stall sampling + software stacks | EU stall-based sampling mapped to source functions across CPU/GPU boundaries | Visualize cost from Python/PyTorch stacks into accelerator stalls; highlight memory-bound code paths in practice[^7] |

The significance of this table is twofold: it shows how to triangulate evidence across layers—kernel metrics, debugger inspection, and CPU profiling—and it clarifies the distinct vantage points each tool provides. Used together, they support a rigorous, end-to-end narrative of where time is spent and why.

Information gaps and validation. A complete set of raw ncu reports and disassembly for every kernel across all model sizes and hardware configs is too large to reproduce here. We provide representative examples and commands to replicate. Nsight Compute versions and metric names can evolve; verify metrics on your target driver/toolkit. On-device profiling for CPU vs GPU on iOS/Android remains constrained; we emphasize Linux-centric tools with well-documented metrics. perf events vary by CPU generation; adjust event lists accordingly.

## Transformer Memory Access Patterns: From Theory to Kernel Reality

Transformer attention performs repeated trips to high-bandwidth memory (HBM) through a complex choreography of Q/K/V projections, attention score computation, and weighted value accumulation. During decode, the KV-cache—storing per-token Key and Value projections—becomes the dominant data structure, accessed repeatedly across layers and batches. Two properties matter most to bandwidth:

- Arithmetic intensity. The ratio of FLOPs to bytes moved in attention kernels tends to be low, often between 0.5 and 1.0. That means each byte fetched from memory is involved in only a handful of arithmetic operations, insufficient to saturate compute pipelines even when tensor cores are available.
- Concurrency and locality. Warps iterate over sequences and heads in patterns that may not align with cache-line boundaries. Even when L2 cache hit rates are high for strided global loads, sustained performance is often constrained by DRAM throughput and the input/output nature of attention: outputs are written at rates comparable to inputs, producing heavy traffic on both read and write paths.

At scale, decode dominates wall-clock time, particularly under large-batch online serving. The combination of low arithmetic intensity, repeated KV-cache access, and output writeback keeps attention kernels resident in the memory-bound regime. This explains why compute warps in flight are often low while DRAM read utilization is high and why attention kernel cycles are predominantly stalled due to data access.[^1]

## Profiling Toolkit and Commands: GPU + CPU in Practice

The bedrock of our analysis is disciplined metric collection. We apply a repeatable process to generate, parse, and interpret profiles for both GPU and CPU.

Nsight Compute CLI. We profile attention kernels by name and NVTX range, focusing on decode-phase launches. The basic pattern is to collect the default “basic” set for all kernels and then expand to MemoryWorkload sections for kernels of interest.

Example: profile all attention kernel launches and save a report.

```
ncu -o attention_profile \
  --section MemoryWorkload \
  --section LaunchStats \
  --section Occupancy \
  --nvtx --nvtx-include "attention::decode" \
  ./llm_serve --model meta-llama/Llama-2-7b --batch 256 --kv-type half
```

Example: filter to a specific kernel by name and invocation.

```
ncu -c 1 -k flash_attention_kernel \
  --section MemoryWorkload \
  --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
  ./llm_serve --model opt-2.7b --batch 512
```

CUDA-GDB and GPU coredumps. When a kernel faults or an illegal memory access occurs inside a fused attention kernel, coredumps pinpoint the failure without sacrificial throughput. Environment variables control core dump behavior, including flags to skip saving large memory regions.

Example: enable GPU core dumps on exception and generate a core file for analysis.

```
export CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
export CUDA_COREDUMP_FILE="/tmp/cuda_coredump_%h.%p.%t"
export CUDA_COREDUMP_GENERATION_FLAGS="skip_global_memory,skip_shared_memory,skip_local_memory,skip_constbank_memory"
./llm_serve --model opt-13b --batch 512  # run until IMA occurs

# In cuda-gdb, load the core dump:
(cuda-gdb) target cudacore /tmp/cuda_coredump.host.12345.0
(cuda-gdb) info cuda kernels
(cuda-gdb) disas $errorpc,+16
```

Linux perf for CPU-side corroboration. We sample cache misses, TLB behavior, and page faults, and trace scheduler activity to understand where the host process spends time and how it schedules GPU work.

Example: capture LLC-load misses with call stacks, minor faults, and scheduler switches.

```
# Sample last-level cache misses across the system
perf record -e LLC-load-misses -c 100 -ag -- sleep 10

# Trace minor faults (RSS growth)
perf record -e minor-faults -ag

# Scheduler behavior
perf sched record -- sleep 1
perf sched latency
perf sched map
```

These commands enable a multi-layer narrative: ncu attributes time spent in GPU memory traffic; perf shows whether the application is spending CPU cycles in allocation paths, NUMA traffic, or scheduling; CUDA-GDB identifies which kernel and which thread coordinates produced the fault.

To support replication, the following table maps common NVIDIA profiler metrics to their conceptual meanings.

| Metric (Nsight Compute) | Meaning | Insight |
|---|---|---|
| dram__bytes_read.sum | Bytes read from device DRAM (HBM) | Sustained throughput ceiling; high values confirm memory-bound behavior |
| dram__bytes_write.sum | Bytes written to device DRAM (HBM) | Output writeback cost; important in attention score and output accumulations |
| lts__t_sector_hit_rate.pct | L2 cache hit rate as sector coverage | Effective locality; higher hit rates mitigate DRAM traffic but may not eliminate saturation |
| smsp__warp_issue_stalled_long_scoreboard_per_warp_active.pct | Warps stalled due to memory dependency | Indicates load-to-use latency; typical in attention with strided loads |
| smsp__warp_issue_stalled_mio_throttle_per_warp_active.pct | Warps stalled by memory/input-output queue throttle | Shared memory or LSU contention; often appears with aggressive tiling |
| smsp__inst_executed.avg.per_cycle_active (IPC) | Instructions executed per active cycle | Compute throughput; lower IPC in memory-bound regimes |
| smsp__warps_active.avg.pct_of_peak_sustained_active | Achieved occupancy | Light occupancy under large-batch decode suggests underutilized SMs due to memory stalls[^4][^5] |

This mapping clarifies how to interpret raw counters: sustained high DRAM bytes with low IPC and high long-scoreboard stalls point to memory stalls rather than compute or instruction fetch issues.

### Nsight Compute: Kernel Filtering and Metrics

We typically profile the first N launches to avoid excessive overhead, focusing on steady-state decode. NVTX ranges improve precision: wrapping decode iterations with labeled ranges (e.g., “decode”, “prefill”) isolates specific phases and reduces post-processing.

Example: collect only the MemoryWorkload group for attention kernels, skipping the first two launches to reach steady state.

```
ncu -s 2 -c 5 -k "attention.*" \
  --section MemoryWorkload \
  --metrics "group:MemoryWorkload" \
  ./llm_serve --model llama-2-7b --batch 512
```

### CUDA-GDB and GPU Coredumps

Focus management is central to interpreting coredumps. Switching to the SM and warp where the exception occurred provides context; inspection of the program counter and kernel arguments ties the failure to specific inputs and launch parameters.

Example: switch focus and inspect registers at the error PC.

```
(cuda-gdb) cuda device 0 sm 7 warp 10 lane 2
(cuda-gdb) info registers $R0 $R1 $R2 $R3
(cuda-gdb) disas $errorpc,+16
```

Using coredumps in tandem with Compute Sanitizer’s memcheck tool yields robust isolation of illegal memory accesses that might otherwise be hidden by asynchronous error reporting in CUDA Graphs.[^3][^6]

### Linux perf for CPU-Side Correlation

We use perf mem to profile memory access types (loads, stores), cache hits/misses, and latency, and perf stat to count syscalls and context switches.

Example: summarize memory access behavior and minor faults.

```
perf stat -e L1-dcache-loads,L1-dcache-load-misses,minor-faults ./llm_serve --model opt-1.3b --batch 96

# Detailed memory access sampling with call stacks
perf record -e L1-dcache-load-misses -c 10000 -ag -- sleep 5
perf mem report
```

These CPU-side measurements reveal whether the host program is coping with allocation churn or page-reclaim pressure, and whether NUMA placement affects data paths feeding GPU transfers.[^2]

## Experimental Setup

Our setup mirrors production-like serving conditions and isolates decode-phase behavior at scale. We consider:

- Models. OPT-1.3B, OPT-2.7B, Llama-2-7B, and Llama-2-13B, representative of mid-size and larger models in the decoder-only family.
- Batching. We explore small to maximum supported batch sizes, with particular emphasis on large-batch regimes where throughput plateaus and latency targets (SLOs) become binding.
- Workload modes. Online traces (e.g., ShareGPT-derived) exhibit burstiness and concurrency; offline synthetic prompts fix prompt and output lengths to standardize performance baselines.

To make the configuration explicit, the following table summarizes the environment.

| Dimension | Configuration |
|---|---|
| Hardware | NVIDIA H100-class GPUs with high-bandwidth memory; sufficient host RAM and modern CPU for scheduler/perf capture |
| Software | vLLM-class serving stack; CUDA toolkit with Nsight Compute; Linux perf; CUDA-GDB |
| Profiling tools | Nsight Compute CLI (ncu), CUDA-GDB, Linux perf (stat/record/mem/sched) |
| Models | OPT-1.3B, OPT-2.7B, Llama-2-7B, Llama-2-13B |
| Phases | Prefill and decode; focus on decode-phase behavior |
| Batching | From small to maximum batch; emphasis on large-batch regimes |
| Modes | Online (trace-driven) and offline (fixed prompt/output lengths) |

This setup ensures results generalize to typical inference deployments, including microservices and batch-serving contexts.

## Results: Bandwidth, Stalls, and Cache Behavior

We synthesize GPU-side metrics, including DRAM utilization, cache hit rates, and warp stall breakdowns, and interpret them in light of decode-phase dominance and batch scaling. The qualitative picture is consistent: as batch sizes increase, attention kernels move more data per second, approach DRAM saturation, and exhibit high fractions of cycles stalled on data access. Compute warps in flight remain modest, indicating SMs are not compute-starved but memory-constrained.

To make the analysis concrete, we organize representative metrics across models and batch sizes.

### GPU decode-phase metrics: by model and batch size

The following table summarizes decode-phase metrics for selected models under large-batch conditions. Values are representative of observed ranges and trends; they illustrate the memory-bound nature of attention rather than prescribe exact numbers for any one environment.

| Model | DRAM read utilization (avg) | Compute warps in flight (avg) | L1 hit rate (avg) | L2 hit rate (avg) |
|---|---|---|---|---|
| OPT-1.3B | ~48% | ~13% | ≤12% | ≤2% |
| OPT-2.7B | ~61% | ~31% | ≤12% | ≤2% |
| Llama-2-7B | ~71% | ~10% | ≤12% | ≤2% |
| Llama-2-13B | ~77% | ~10% | ≤12% | ≤2% |

These figures reflect the overarching pattern: DRAM read utilization rises with batch size, cache hit rates are low and tend to decline as batch grows, and compute warps in flight are far below peak even though SMs are active.[^1]

### Warp stall breakdown for attention kernels

Attention kernel stalls cluster around memory dependencies and throttle conditions tied to shared memory and LSU pressure. The following table summarizes typical stall categories in large-batch decode.

| Stall category | Typical share in memory-bound regimes | Interpretation |
|---|---|---|
| Long scoreboard (memory dependency) | High | Load-to-use latency dominates; strided KV-cache reads prevent ideal coalescing |
| MIO throttle (memory/input-output) | Moderate to high | Shared memory bank conflicts; LSU queue pressure due to concurrent loads/stores |
| Not selected / other | Variable | Underutilized warp schedulers; low eligibility due to memory stalls |
| Texture throttle / pipe busy | Low to moderate | Less prominent in exact attention; may appear with fused elementwise chains[^4] |

The significance is clear: the kernel’s time is spent waiting for memory, not executing arithmetic. Optimizations should reduce bytes moved and improve locality; adding more compute power yields diminishing returns under these conditions.

### Prefill vs decode time share

Prefill processes the prompt in a single pass, but decode consumes the majority of time in large-batch regimes.

| Model | Decode time share (max batch) |
|---|---|
| OPT-1.3B | >95% |
| OPT-2.7B | >95% |
| Llama-2-7B | >95% |
| Llama-2-13B | >95% |

This dominance underscores why KV-cache management and attention kernel efficiency are pivotal to throughput and tail latency.

### Batch size scaling: trend summary

As batch size increases, arithmetic intensity for attention stays roughly constant (0.5–1.0 ops/byte), L1/L2 hit rates decline, and DRAM read utilization climbs toward saturation. Compute warps in flight remain low, reflecting that warps spend much of their time stalled on data. These trends persist even when using optimized kernels like FlashAttention, which reduce memory traffic but do not escape the memory-bound regime at high batch sizes.[^1]

### Throughput and latency: replication vs single replica

Running multiple replicas of the model on the same GPU can increase throughput at the cost of slightly higher inter-token latency. The following table shows representative gains from replication.

| Model | Throughput improvement vs single replica (max batch) | Inter-token latency change | CPU time reduction (two replicas) |
|---|---|---|---|
| OPT-1.3B | +34% (4 replicas) | +28% average | −78% |
| OPT-2.7B | +13% (2 replicas) | Slight increase | Not specified (trend: reduced CPU idle) |

The benefit stems from overlapping operations and using freed memory from aggressive batching strategies to drive concurrent execution; it mitigates DRAM saturation by raising average DRAM read while lowering per-replica memory stalls.[^1]

## From Metrics to Action: Optimization Playbook

The evidence points to an optimization hierarchy rooted in memory:

1. Reduce bytes moved.
   - Fuse kernels to minimize intermediate memory traffic (FlashAttention and related fusions).
   - Minimize redundant KV-cache reads and writes via tiling and careful loop ordering.
   - Avoid unnecessary materialize-and-reload patterns that expand live memory.
2. Improve locality and reuse.
   - Increase L2 hit rates where possible through block-level swizzling or layout choices that reduce conflict misses; do not expect L2 tweaks to solve saturation at high batch sizes.[^8]
   - Tune shared memory bank conflicts and padding; reduce bank collisions during warp-level accumulation.
3. Increase effective concurrency without oversubscribing memory.
   - Adopt batching strategies that maximize throughput under tail latency SLOs; consider a Batching Configuration Advisor to choose optimal batch sizes that avoid memory waste.[^1]
   - Use controlled replication (MPS or multi-process) to increase compute warps in flight and overlap memory operations across replicas.[^1]
4. Exploit high CPU–GPU bandwidth paths when available.
   - On tightly coupled systems (e.g., GH200-like), parameter remapping can expand KV-cache capacity with unidirectional transfers, negligible synchronization, and overlapping transfer with compute. This avoids bidirectional swap overhead and improves tail latency and throughput in multi-tenant serving.[^9]

To guide triage, the following table maps symptoms to likely mitigations.

| Symptom | Observed metrics | Likely cause | Mitigation |
|---|---|---|---|
| High DRAM read utilization; low IPC | dram__bytes_read.sum high; smsp__inst_executed.avg.per_cycle_active low | Memory-bound attention | Kernel fusion; reduce bytes per token; increase reuse with tiling; consider batching constraints[^1][^4] |
| High long-scoreboard stalls | smsp__warp_issue_stalled_long_scoreboard_per_warp_active.pct high | Load-to-use latency on KV-cache reads | Improve coalescing; adjust layout/stride; prefetch; shorten critical paths[^4] |
| High MIO throttle stalls | smsp__warp_issue_stalled_mio_throttle_per_warp_active.pct high | Shared memory contention | Resolve bank conflicts; padding; reorganize SMEM tiling; double buffering[^4] |
| Low achieved occupancy with high DRAM utilization | smsp__warps_active.avg.pct_of_peak_sustained_active low | Warps blocked by memory; insufficient eligible warps | Replication; MPS; adjust batch size; concurrency to overlap stalls[^1] |
| Poor tail latency under multi-tenant load | P99 TBT and TTFT high | KV-cache capacity exhausted; recomputation or swapping overheads | Parameter remapping with overlapping transfers; cap remapping aggressiveness; dynamic reversion[^9] |

These steps are practical and measurable. They reorient optimization away from raw FLOPs and toward moving fewer bytes, more efficiently.

## Causality Chain: Why Attention Remains Memory-Bound at Scale

Memory-bound behavior emerges from fundamental arithmetic intensity. Attention’s decode phase involves loading Q/K/V projections, computing scores via matrix multiplication, and performing weighted accumulation on V. The KV-cache, written during prefill and reused every token, is read repeatedly in decode; its repeated access patterns dominate traffic. Even when L2 hit rates are substantial, they are not enough to offset the input/output nature of the computation, and DRAM throughput becomes the ceiling.

CPU-side contributions complicate the picture. Under large-batch decode, host-side scheduling and memory management can contribute non-trivially to end-to-end time. Profiling shows CPU time shares that vary by model size; for smaller models at moderate batch sizes, CPU contributions can account for a sizable fraction of wall-clock. Replication reduces CPU idle time and increases GPU utilization, but it raises inter-token latency slightly while improving overall throughput. The trade-off is often acceptable in production when tail latency SLOs are met.[^1][^2]

At very high batch sizes, attention remains memory-bound even with optimized kernels like FlashAttention. The memory-optimized design reduces HBM reads/writes but does not fundamentally change arithmetic intensity; the system still saturates DRAM bandwidth. This reality informs scheduling: increasing FLOPs or enabling tensor cores yields limited benefit unless bytes moved per token are reduced or concurrency is increased to overlap stalls.[^1]

Finally, on tightly coupled CPU–GPU systems, novel KV-cache strategies exploit high interconnect bandwidth. Parameter remapping repurposes GPU memory assigned to inactive models to expand KV-cache capacity with unidirectional, non-blocking transfers overlapped with compute. This avoids the bidirectional traffic and synchronization inherent in swapping schemes and improves both throughput and tail latency in multi-tenant contexts.[^9]

## Synthesis and Recommendations

The throughline of our analysis is clear: transformer inference at scale is dominated by memory traffic. This is observed in decode-phase dominance, low arithmetic intensity, high DRAM utilization, and warp stalls attributable to data access. Compute resources are underutilized because warps spend their time waiting for memory.

Recommendations for practitioners:

- Choose batching and concurrency to hit SLOs without pushing into DRAM saturation. Use profiling-driven advisors to pick batch sizes that balance throughput and latency.[^1]
- Reduce bytes moved in attention kernels via fusion and tiling; prioritize locality and reuse over raw FLOPs. Consider warptiling and shared-memory optimizations where appropriate.[^4][^5][^8]
- Instrument and visualize with a reproducible toolchain. Use ncu for GPU metrics, CUDA-GDB/coredumps for fault isolation, and perf for CPU-side behavior; adopt flame-graph-style visualization to expose cost across stacks when available.[^2][^3][^4][^7]
- Exploit high CPU–GPU interconnect bandwidth for KV-cache expansion via parameter remapping where supported; cap aggressiveness to balance latency and throughput, and revert dynamically during off-peak periods.[^9]

Action checklist:

1. Baseline profiling. Collect MemoryWorkload sections and warp stall breakdowns for decode-phase attention kernels at target batch sizes.[^4][^5]
2. Batching and replication. Select batch sizes with an advisor; evaluate controlled replication (MPS) to overlap memory operations and raise compute warps in flight.[^1]
3. Kernel tuning. Review shared memory tiling and bank conflicts; consider warptiling and double buffering; vectorize global loads where alignment permits.[^8][^4]
4. KV-cache strategy. On GH200-like systems, integrate parameter remapping; tune remapping percentage and layer selection; enable dynamic reversion.[^9]
5. Visualization. Generate flame-graph views where feasible; search for dominant stalls and kernel paths; tie cost to specific code and configuration.[^7]

Limitations. The mapping from perf memory events to kernel-level memory bandwidth is indirect; counters and sampling are architecture-dependent and may require calibration. Tooling maturity varies across vendors; particular counter availability can change between driver versions and architectures. Finally, different attention kernels and vendor-specific fused kernels will produce different counter signatures; replicate experiments with your target kernels for definitive attribution.

## Appendix: Command Cheat-Sheet and Replication Recipe

A consolidated set of commands and a minimal harness help reproduce the analysis:

Nsight Compute CLI (ncu). Profile attention kernels, collect MemoryWorkload, and filter by NVTX ranges or kernel names.

```
# Baseline attention profiling
ncu -o baseline \
  --section MemoryWorkload \
  --section LaunchStats \
  --section Occupancy \
  --nvtx --nvtx-include "attention::decode" \
  ./llm_serve --model llama-2-7b --batch 256

# Specific kernel, skip initial launches, limit to N launches
ncu -s 2 -c 3 -k flash_attention \
  --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
  ./llm_serve --model opt-2.7b --batch 512

# Query available metrics and sections
ncu --list-sections
ncu --query-metrics --query-metrics-mode all
```

CUDA-GDB and coredumps. Capture and analyze GPU coredumps on exception.

```
# Enable coredumps with size-conscious flags
export CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
export CUDA_COREDUMP_FILE="/tmp/cuda_coredump_%h.%p.%t"
export CUDA_COREDUMP_GENERATION_FLAGS="skip_global_memory,skip_shared_memory,skip_local_memory,skip_constbank_memory"

# In cuda-gdb:
(cuda-gdb) target cudacore /tmp/cuda_coredump.host.12345.0
(cuda-gdb) info cuda kernels
(cuda-gdb) cuda device 0 sm 7 warp 10 lane 2
(cuda-gdb) disas $errorpc,+16
(cuda-gdb) info registers $R0 $R1 $R2 $R3
```

Linux perf. Sample CPU caches, TLB, page faults, and scheduler behavior.

```
# Cache misses and minor faults
perf stat -e L1-dcache-loads,L1-dcache-load-misses,minor-faults ./llm_serve --model opt-1.3b --batch 96

# Record LLC-load misses with call stacks
perf record -e LLC-load-misses -c 100 -ag -- sleep 5

# Scheduler latency and map
perf sched record -- sleep 1
perf sched latency
perf sched map
```

Flame graphs (conceptual). Where supported, generate AI flame graphs to visualize stalls across CPU and accelerator stacks; search for dominant cost centers and correlate with kernel and source functions.[^7]

Minimal harness. A synthetic workload producing steady-state decode iterations under fixed batch size and NVTX ranges is ideal; ensure NVTX annotations match your filtering rules and that the workload reproduces the batch and concurrency you intend to measure.

To support interpretation of perf commands, the following table summarizes commonly used events.

| perf event | Purpose |
|---|---|
| L1-dcache-loads / L1-dcache-load-misses | Data cache load behavior and miss rate |
| dTLB-loads / dTLB-load-misses | TLB pressure for data accesses |
| LLC-loads / LLC-load-misses | Last-level cache behavior, system-wide |
| minor-faults | Page faults and RSS growth |
| sched:sched_switch | Context switches and scheduler latency analysis |
| probe_libc:malloc | Trace malloc() invocation and size (with debuginfo) |

These events provide CPU-side corroboration for the GPU-side memory narrative and help identify host-side contributors to end-to-end latency.[^2]

## References

[^1]: Unveiling GPU Bottlenecks in Large-Batch LLM Inference (arXiv:2503.08311v2). https://arxiv.org/html/2503.08311v2

[^2]: Linux perf Examples - Brendan Gregg. https://www.brendangregg.com/perf.html

[^3]: CUDA-GDB 13.0 Documentation. https://docs.nvidia.com/cuda/cuda-gdb/index.html

[^4]: Kernel Profiling Guide — Nsight Compute 12.4. https://docs.nvidia.com/nsight-compute/2024.1/ProfilingGuide/index.html

[^5]: Nsight Compute CLI — NsightCompute 12.4. https://docs.nvidia.com/nsight-compute/2024.1/NsightComputeCli/index.html

[^6]: CUDA Core Dump: An Effective Tool to Debug Memory Access Errors — vLLM Blog. https://blog.vllm.ai/2025/08/11/cuda-debugging.html

[^7]: AI Flame Graphs — Brendan Gregg. https://www.brendangregg.com/blog/2024-10-29/ai-flame-graphs.html

[^8]: How to Optimize a CUDA Matmul Kernel for cuBLAS-like Performance. https://siboehm.com/articles/22/CUDA-MMM

[^9]: MIRAGE: KV Cache Optimization through Parameter Remapping for Multi-tenant LLM Serving (arXiv:2507.11507v1). https://arxiv.org/html/2507.11507v1

---

### Acknowledged Information Gaps

- Raw Nsight Compute reports for every kernel and model configuration are not included; we provide representative commands and sections to replicate.
- Disassembly (PTX/SASS) for all variants of attention kernels is beyond scope; we instead supply patterns and metrics demonstrating bandwidth-bound behavior.
- OS-level system call tracing (strace) is less relevant on Linux with perf; we emphasize perf where appropriate and note that low-level profiling constraints exist on mobile platforms.
- perf memory events and mapping to kernel-level bandwidth are indirect; architecture-dependent counters may require adaptation.
- Tooling maturity varies; counter availability differs across vendor stacks and driver versions.
- Different attention kernels and vendor-specific fused kernels produce different counter signatures; replicate with your target kernels for precise attribution.