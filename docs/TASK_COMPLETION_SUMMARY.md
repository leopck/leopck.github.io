# Blueprint for Five LLM Hardware Deep-Dive Posts (Brendan Gregg Style)

## Executive Overview and Deliverables

This blueprint defines a five-post series that analyzes large language model (LLM) hardware performance from the code level outward, following Brendan Gregg’s style: hypothesis-driven, metric-first, and action-oriented. Each post targets a different layer of the stack—GPU memory bandwidth, OS-level system calls, CPU cache behavior, end-to-end memory bottlenecks, and GEMM kernel internals—anchored by reproducible workflows and command-line instrumentation. The narrative arc begins with foundational memory access patterns in transformer models, progresses through OS scheduling and CPU cache effects, culminates in holistic bottleneck identification, and concludes with a reverse-engineered path to cuBLAS-competitive GEMM performance. The series is designed for GPU kernel engineers, performance engineers, ML systems researchers, and production infrastructure teams.

Deliverables:
- Five posts, each with an executive summary, method, empirical analysis, tooling section, diagnostics-to-action mapping, reproducibility guide, and references.
- Command-line examples: Nsight Compute CLI (ncu), CUDA-GDB, perf, strace equivalents via perf, flame graphs.
- Code snippets and disassembly guidance for GEMM kernel optimization.
- Memory dumps and register analysis patterns for debugging and validation.
- Performance counter interpretation and mapping to mitigation strategies.

To ground the series and maintain fidelity to observed behavior, we reference recent evidence that LLM inference at large batch sizes remains dominated by memory traffic rather than compute saturation, with decode-phase attention kernels operating in a memory-bound regime and showing high DRAM read utilization at scale.[^1]

To illustrate the analytical span of the series, Table 1 maps each post to its tooling, metrics, and typical outputs.

Table 1. Post-to-metrics mapping and expected outputs

| Post | Primary tools | Key metrics | Typical outputs |
|---|---|---|---|
| 1. Tracing GPU Memory Bandwidth in Transformer Models | Nsight Compute CLI (ncu) | dram__bytes_read.sum, dram__bytes_write.sum, lts__t_sector_hit_rate.pct, warp stall breakdown | Kernel-level attribution of cycles to memory, quantified DRAM saturation, cache hit rate trends across batch sizes |
| 2. CPU vs GPU Inference: A System Call Analysis | perf (stat/record/sched/mem), Nsight Systems | syscalls tracepoints, context-switch latencies, minor faults, CPU-side memory sampling | Side-by-side OS-level patterns, scheduling correlations, low-overhead alternatives to strace |
| 3. Cache Hierarchy Optimization in Attention Mechanisms | perf mem, perf c2c, Nsight Compute (where applicable) | L1/L2/LLC hit/miss rates, TLB behavior, data layout/tiling impacts | Cache miss hotspots, layout-driven gains, guidance on tiling and prefetching |
| 4. Memory Bandwidth Bottlenecks in LLMs | ncu, CUDA-GDB, perf | MemoryWorkload sections, warp stalls, CPU correlation, coredump traces | End-to-end bottleneck diagnosis, triage to kernel fusion, batching strategies, KV-cache tactics |
| 5. Hardware-Accelerated Matrix Multiplication Deep Dive | Nsight Compute, CUDA-GDB, cuobjdump, cutlass参考 | Achieved GFLOPs/s, stall reasons, shared memory bank conflicts, vectorized loads | Iterative optimization from naive to 94% cuBLAS, PTX/SASS insights, double buffering and warptiling guidance |

Taken together, these posts establish a practical framework: start with the memory footprint (Post 1), understand OS scheduling and CPU cache effects (Posts 2–3), triage end-to-end bottlenecks (Post 4), and tune the heavy hitter—GEMM kernels—until metrics confirm near-peak utilization (Post 5).

## Cross-Cutting Methodology and Tooling

The series prioritizes reproducible workflows and conservative overhead. We standardize on the following tools and practices.

- Nsight Compute CLI (ncu). Use kernel filtering, NVTX ranges, section sets, and replay modes to collect memory workload sections, occupancy, and warp stall breakdowns. Query available metrics and sections before collection to avoid instrumentation bloat.[^4][^5]
- CUDA-GDB and GPU coredumps. Compile with debug symbols (-lineinfo or -G). Enable GPU coredumps on exception to capture SM/warp/lane focus, program counter (PC), and kernel arguments. Use Compute Sanitizer’s memcheck for isolated inspection of illegal memory access (IMA).[^3][^6]
- Linux perf. Prefer perf tracepoints and sampling over strace for lower overhead in production-like environments. Combine perf stat, perf record, perf mem, perf sched, and perf c2c to correlate CPU scheduling, memory access behavior, and cache coherency effects.[^2]
- Flame graphs. Apply AI flame graphs to visualize full-stack cost—including accelerator stalls and software call paths—searchable by symbol or instruction offset.[^7]
- Command patterns. Start with baseline collections, then target specific hypotheses (e.g., “Are warps stalled long_scoreboard?” “Is LLC miss rate excessive?”).

Table 2 summarizes tool capability and typical use cases across the series.

Table 2. Tool capability matrix and use cases

| Tool | Capabilities | LLM use cases | Notes |
|---|---|---|---|
| Nsight Compute CLI (ncu) | Kernel-level metrics, sections, replay, NVTX filtering | MemoryWorkload attribution, warp stalls, occupancy, L2 hit rate | Use sections selectively to control overhead; replay for comprehensive metrics[^4][^5] |
| CUDA-GDB + coredumps | Breakpoints, focus management, PC/disasm, registers, kernel args | Pinpoint IMA in fused/Graph kernels; correlate launch coordinates with faults | Enable core dumps on exception; size-conscious flags for large models[^3][^6] |
| Linux perf | stat/record/mem/sched/c2c; tracepoints | CPU-side correlation: syscalls, cache/TLB, minor faults, scheduler latency | Lower overhead than strace; wide event coverage[^2] |
| AI Flame Graphs | Full-stack visualization of stalls and cost | Attribute stalls to source functions across CPU/GPU boundaries | Searchable; design focused on production safety and low overhead[^7] |

Command cheat-sheet (high-frequency patterns):
- ncu --section MemoryWorkload --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct ./app
- ncu --nvtx --nvtx-include "decode" --kernel-id regex:".*attention.*" -c 5 ./app
- perf stat -e 'syscalls:sys_enter_*' -p PID
- perf record -e L1-dcache-load-misses -c 10000 -ag -- sleep 5
- perf sched record -- sleep 1; perf sched latency; perf sched map
- CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1; generate-core-file; target cudacore

Information gaps and mitigations:
- ncu metric names and availability can change across driver/toolkit versions; verify with --query-metrics prior to collection.[^4]
- perf events vary by CPU generation; consult host documentation to adapt event lists.[^2]
- Mobile/iOS profiling constraints limit low-level OS tracing; focus on desktop Linux environments for reproducibility.
- Large-volume raw reports and full PTX/SASS disassembly are not reproduced here; we provide representative examples and replication guidance.

## Post 1 — Tracing GPU Memory Bandwidth in Transformer Models

Hypothesis. At scale, attention in the decode phase is memory-bound: FLOPs are not the limiter; bytes moved are. Arithmetic intensities around 0.5–1.0 ops/byte and high warp stalls due to memory dependencies should coincide with high DRAM read utilization and low compute warps in flight.[^1]

Methodology. Profile decode-phase attention kernels via Nsight Compute CLI, collecting MemoryWorkload sections and warp stall breakdowns. Filter kernels by name or NVTX ranges to isolate decode. Capture DRAM bytes, L2 hit rates, and stall reasons. Use CUDA-GDB and coredumps when faults occur to correlate failure sites with launch coordinates and memory access patterns.[^4][^5][^3][^6]

Analysis. In large-batch regimes, measured attention kernels typically show:
- DRAM read utilization frequently in the 60–80% range.
- L1/L2 hit rates relatively low and decreasing as batch increases.
- Warp stalls concentrated on memory dependency (long scoreboard) and MIO throttle, indicating shared memory and LSU pressure.
These metrics align with the memory-bound diagnosis: warps spend a majority of cycles waiting on data rather than executing arithmetic.[^1]

Table 3 organizes representative metrics across models and batch conditions.

Table 3. GPU decode-phase metrics (representative ranges)

| Model | DRAM read utilization (avg) | Compute warps in flight (avg) | L1 hit rate (avg) | L2 hit rate (avg) |
|---|---|---|---|---|
| OPT-1.3B | ~48% | ~13% | ≤12% | ≤2% |
| OPT-2.7B | ~61% | ~31% | ≤12% | ≤2% |
| Llama-2-7B | ~71% | ~10% | ≤12% | ≤2% |
| Llama-2-13B | ~77% | ~10% | ≤12% | ≤2% |

Table 4 summarizes warp stall categories most commonly observed in attention kernels.

Table 4. Warp stall breakdown for attention kernels

| Stall category | Typical share in memory-bound regimes | Interpretation |
|---|---|---|
| Long scoreboard (memory dependency) | High | Load-to-use latency dominates due to repeated KV-cache reads |
| MIO throttle (memory/input-output) | Moderate–High | Shared memory bank conflicts or LSU queue pressure |
| Not selected / other | Variable | Underutilized schedulers due to stalled warps |
| Texture / pipe busy | Low–Moderate | Less dominant in exact attention; may appear in fused elementwise chains |

Reproducible commands.
- Profile attention kernels by NVTX range and collect MemoryWorkload metrics:

```
ncu --section MemoryWorkload \
    --nvtx --nvtx-include "attention::decode" \
    --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
    ./llm_serve --model <model> --batch <N>
```

- Filter kernel launches to steady state and limit count:

```
ncu -s 2 -c 5 -k ".*attention.*" \
    --section MemoryWorkload \
    --metrics "group:MemoryWorkload" \
    ./llm_serve --model <model> --batch <N>
```

- GPU coredump capture and inspection (on exception):

```
CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
CUDA_COREDUMP_FILE="/tmp/cuda_coredump_%h.%p.%t"
CUDA_COREDUMP_GENERATION_FLAGS="skip_global_memory,skip_shared_memory,skip_local_memory,skip_constbank_memory"

# In cuda-gdb:
(cuda-gdb) target cudacore /tmp/cuda_coredump.host.12345.0
(cuda-gdb) info cuda kernels
(cuda-gdb) disas $errorpc,+16
(cuda-gdb) info registers $R0 $R1 $R2 $R3
```

Diagnostics-to-action mapping.
- High DRAM read + low IPC + long_scoreboard stalls → fuse kernels, reduce bytes moved, improve reuse (tiling), consider batching constraints.
- High MIO throttle → resolve shared memory bank conflicts via padding or layout changes; introduce double buffering to interleave loads and compute.
- Low L2 hit rate → adjust block-level swizzling for L2 locality; verify alignment; ensure vectors are coalesced.

Flame graph interpretation. AI flame graphs visualize the full stack and expose the proportion of stall samples attributable to memory-bound code paths across CPU and accelerator code. Searching for specific stall reasons or function names pinpoints hotspots that dominate wall-clock.[^7]

### Tooling Deep Dive — Nsight Compute CLI

We use kernel filtering and section collection to isolate attention decode:
- Include/exclude kernels via -k or --nvtx-include; limit launches via -c and -s.
- Select MemoryWorkload sections and specific metrics: dram__bytes_read.sum, dram__bytes_write.sum, lts__t_sector_hit_rate.pct.[^4][^5]

Example filtering and targeted collection:

```
ncu -c 1 -k flash_attention_kernel \
    --section MemoryWorkload \
    --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
    ./llm_serve --model <model> --batch <N>
```

### Tooling Deep Dive — CUDA-GDB and GPU Coredumps

Use coredumps to attribute faults precisely:
- Focus management (device, SM, warp, lane) to locate exception site; inspect PC and kernel arguments.
- Disable collection of large memory regions to keep coredump sizes manageable (skip flags), then use Compute Sanitizer’s memcheck for deep IMA analysis.[^3][^6]

Example focus and disassembly:

```
(cuda-gdb) cuda device 0 sm 7 warp 10 lane 2
(cuda-gdb) disas $errorpc,+16
```

### Diagnostics and Action Plan

Table 5 maps observed symptoms to mitigations.

Table 5. Symptom-to-mitigation matrix (attention memory bottlenecks)

| Symptom | Observed metrics | Likely cause | Mitigation |
|---|---|---|---|
| High DRAM utilization, low IPC | dram__bytes_read.sum high; smsp__inst_executed.avg.per_cycle_active low | Memory-bound attention | Kernel fusion; reduce bytes per token; increase reuse via tiling; revisit batching policy[^1][^4] |
| Long scoreboard stalls | smsp__warp_issue_stalled_long_scoreboard_per_warp_active.pct high | Load-to-use latency on KV-cache | Improve coalescing; adjust layout/stride; prefetch; shorten critical paths |
| MIO throttle stalls | smsp__warp_issue_stalled_mio_throttle_per_warp_active.pct high | Shared memory contention | Resolve bank conflicts; pad arrays; reorder tiling; introduce double buffering |
| Low achieved occupancy despite high DRAM utilization | smsp__warps_active.avg.pct_of_peak_sustained_active low | Warps blocked by memory | Increase concurrency via controlled replication (MPS) or batch tuning to overlap stalls[^1] |

## Post 2 — CPU vs GPU Inference: A System Call Analysis

Hypothesis. CPU-only inference can outperform GPU for smaller models and short sequences due to reduced kernel launch overhead, NUMA locality, and cache-friendly CPU execution. Conversely, GPUs excel for larger models as memory bandwidth and compute density become the limiter. OS-level scheduling and system calls influence tail latency and throughput.

Methodology. Compare CPU vs GPU inference paths using Linux perf for syscalls, scheduler traces, and memory sampling; where applicable, Nsight Systems provides complementary view of GPU activity. Use perf tracepoints and sampling in preference to strace for production-suitable overhead.[^2][^14]

Observation. For smaller models under F16, multi-threaded CPU execution can surpass GPU throughput due to kernel launch and transfer overheads; optimal CPU threads typically fall in the 4–5 range. On-device and mobile profiling remain constrained; thus, our reproducible examples focus on Linux desktop/server environments.[^2]

Table 6 contrasts throughput characteristics and their OS-level implications.

Table 6. Throughput comparison (representative)

| Model size / precision | CPU-only throughput | GPU throughput | OS-level implications |
|---|---|---|---|
| ~1B, F16 | ~17 tokens/s (2–4 threads) | ~12.8 tokens/s | CPU benefits from thread locality and reduced launch overhead; GPU penalized by transfer and small GEMM underutilization |
| >1.5B, F16 | Declines relative to GPU | Higher sustained throughput | GPU memory bandwidth and compute density dominate as model size grows |

Table 7 maps common syscall categories to interpretation and follow-up actions.

Table 7. System call mapping and interpretation

| Syscall category | What it means | When to investigate | Follow-up |
|---|---|---|---|
| read/write | Data movement to/from user buffers | Unexpected I/O spikes or networking in serving stack | Perf tracepoint on read/write; correlate with request bursts |
| mmap/mprotect | Virtual memory region management | Frequent allocations or protection changes | perf mem; investigate allocation hotspots and page fault rates |
| clone/futex | Thread creation and synchronization | Thread pool behavior under batch sizing | perf sched; evaluate context-switch latency and CPU pinning |
| sched_yield | Voluntary yielding | Contention or spin patterns | perf stat; check run queue saturation and CPU saturation |

Reproducible commands.
- Syscall counting via perf:

```
perf stat -e 'syscalls:sys_enter_*' -p PID
perf stat -e 'syscalls:sys_enter_*' -a sleep 5
```

- Low-overhead tracing equivalent to strace:

```
perf record -e syscalls:sys_enter_read --filter 'count < 10' -a
perf trace -- ./app
```

- Scheduler analysis:

```
perf sched record -- sleep 1
perf sched latency
perf sched map
```

- Memory sampling and TLB behavior:

```
perf record -e L1-dcache-load-misses -c 10000 -ag -- sleep 5
perf record -e dTLB-load-misses -ag -- sleep 5
```

### Tooling Deep Dive — perf and eBPF Alternatives

Prefer perf tracepoints over strace to avoid overhead and capture richer context (call stacks, samples). Use:
- perf stat for counters; perf record for stack traces and filtered tracing; perf mem for memory access profiles; perf c2c for cacheline analysis; perf sched for scheduler latency and maps.[^2]

Command catalog (selected):
- perf record -F 99 -ag -- sleep 10
- perf c2c record -a -- sleep 10; perf c2c report
- perf probe -x /lib64/libc.so.6 malloc; perf record -e probe_libc:malloc -a

### Interpretation Guide

Table 8 translates common patterns into actions.

Table 8. Pattern-to-action mapping (CPU-side)

| Pattern | Likely cause | Action |
|---|---|---|
| High minor-faults and RSS growth | Allocation churn; overcommit | Optimize allocator; reuse buffers; examine NUMA placement |
| Elevated context switches and sched latency | Oversubscription; poor pinning | Pin threads; reduce batch concurrency; adjust CPUgovernor |
| High LLC-load-misses | Working set exceeds LLC; poor locality | Increase data locality; block/til data; prefetch hints |
| read/write bursts | I/O in serving path | Separate data plane; coalesce I/O; profile network栈 |

On-device constraints. Limited OS access and hardware counter availability on mobile platforms hinder low-level profiling; prioritize reproducible Linux workflows with documented perf event sets.[^2]

## Post 3 — Cache Hierarchy Optimization in Attention Mechanisms

Hypothesis. Attention kernels exhibit data reuse patterns that can be amplified by cache-aware data layouts and tiling, improving hit rates and reducing off-chip traffic. Conversely, suboptimal strides and layouts degrade cache performance, raising LLC/L1 miss rates and TLB pressure.

Methodology. Profile CPU-side cache behavior with perf mem and c2c; evaluate hit/miss rates and false-sharing. Cross-check GPU cache hints via Nsight Compute where relevant. Iterate on data layout and tiling strategies, guided by measured cache behavior and TLB effects.[^11][^2]

Evidence. Under attention workloads, L1/L2 hit rates trend downward as batch sizes increase; reductions in cache locality correlate with higher DRAM traffic and longer scoreboard stalls. Attention optimization via tiling and layout adjustments improves locality and reuse, reducing memory stalls and improving pipeline utilization.[^1][^11]

Table 9 summarizes cache miss trends under scaling batch sizes.

Table 9. Cache miss rates vs batch size (representative)

| Batch size | L1 miss rate | LLC miss rate | TLB pressure | Comment |
|---|---|---|---|---|
| Small (≤32) | ~5–8% | ~10–20% | Low | Reuse fits in cache; good locality |
| Medium (≈128) | ~8–12% | ~20–35% | Moderate | Increased streaming behavior; partial reuse |
| Large (≥512) | ≥12% | ≥35% | High | Working set exceeds cache; reuse diminishes |

Reproducible commands.
- L1 and LLC miss sampling with call stacks:

```
perf record -e L1-dcache-load-misses -c 10000 -ag -- sleep 5
perf record -e LLC-load-misses -c 100 -ag -- sleep 5
```

- TLB and memory access profiling:

```
perf record -e dTLB-load-misses,dTLB-loads -ag -- sleep 5
perf mem record -- ./app
perf mem report
```

- Cacheline analysis and false sharing detection:

```
perf c2c record -a -- sleep 10
perf c2c report
```

### Tooling Deep Dive — perf mem/c2c

Use perf mem to sample memory accesses, identify latency, hits/misses, and attributed call stacks. Use perf c2c to detect cacheline contention and false sharing by analyzing remote/local access patterns and ownership.

Command examples:
- perf mem record -- ./app; perf mem report
- perf c2c record -a -- sleep 10; perf c2c report

### Interpretation and Optimization

Table 10 provides a cache symptom-to-action mapping.

Table 10. Cache symptom-to-action matrix

| Symptom | Likely cause | Optimization |
|---|---|---|
| High LLC misses | Poor temporal reuse; streaming | Increase block/tiling; reorder loops; pack data for reuse |
| High L1 misses | Strided access; misalignment | Align data; vectorize; coalesce; consider layout transforms |
| High dTLB misses | Large working pages; sparse access | Use larger pages; prefetch; reduce stride; collapse dimensions |
| False sharing (c2c) | Shared counters/flags across threads | Pad and partition data; avoid cross-thread writes |

Visualization. Flame graphs can be used to overlay CPU cache-miss samples and attribute hotspots to functions, clarifying whether cache inefficiencies arise in attention score computation, data movement, or elementwise post-processing.[^7]

## Post 4 — Memory Bandwidth Bottlenecks in Large Language Models

Hypothesis. LLM inference at scale remains memory-bound. The heavy hitters are DRAM bandwidth saturation, repeated KV-cache access, and output writeback, leading to high warp stalls and low compute utilization. Attention kernels, even when IO-optimized, still saturate memory bandwidth at high batch sizes.[^1]

Methodology. Combine ncu MemoryWorkload sections with CUDA-GDB coredumps for fault isolation and perf for CPU-side correlation. Reproduce bottleneck signatures under controlled batch sizes and analyze stall breakdowns to attribute time spent waiting on memory vs compute.[^4][^5][^3][^6]

Bottleneck quantification. Under maximum batch conditions:
- Compute warps in flight remain low (often ~10–30% on average across models), while DRAM read utilization is high (frequently 60–80% or more).
- Attention kernels show long_scoreboard stalls dominating warps, and MIO throttle indicative of shared memory/LSU pressure.[^1][^4]

Table 11 collates key bottleneck metrics from large-batch decode.

Table 11. Bottleneck metrics summary (representative)

| Metric | Representative range | Interpretation |
|---|---|---|
| DRAM read utilization | ~60–80% (avg), peaks approaching saturation | Memory-bound behavior dominates |
| Compute warps in flight | ~10–31% (avg) | Warps frequently stalled on data |
| L1/L2 hit rates | ≤12% (L1), ≤2% (L2) | Low locality under large batch |
| Warp stall (long_scoreboard) | High share | Load-to-use latency on KV-cache |
| Warp stall (MIO throttle) | Moderate–High | Shared memory or LSU contention |

Reproducible commands.
- GPU memory workload analysis and NVTX filtering:

```
ncu --section MemoryWorkload \
    --nvtx --nvtx-include "decode" \
    --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
    ./llm_serve --model <model> --batch <N>
```

- Coredump isolation for kernel faults:

```
CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
CUDA_COREDUMP_GENERATION_FLAGS="skip_global_memory,skip_shared_memory,skip_local_memory"

# After crash:
(cuda-gdb) target cudacore /tmp/cuda_coredump.<host>.<pid>.<tid>
(cuda-gdb) info cuda kernels
(cuda-gdb) disas $errorpc,+16
```

- CPU correlation via perf:

```
perf stat -e minor-faults,cycles,instructions -a sleep 5
perf record -e sched:sched_switch -ag -- sleep 5
```

### Advanced Strategies — Replication and KV-Cache Tactics

Under memory-bound regimes, pragmatic tactics mitigate bottlenecks:
- Batching Configuration Advisor (BCA). Select batch sizes that maximize throughput while respecting latency SLOs, minimizing KV-cache waste.[^1]
- Replication. Run multiple replicas on a single GPU using MPS to overlap operations, increase compute warps in flight, and improve utilization—accepting modest increases in inter-token latency for higher throughput.[^1]
- KV-cache expansion via parameter remapping. On tightly coupled CPU–GPU systems (e.g., GH200-like), remap inactive model parameters to expand KV-cache capacity, using unidirectional, non-blocking transfers overlapped with compute; cap aggressiveness to balance tail latency and throughput, and dynamically revert during off-peak periods.[^9]

Table 12 summarizes the strategy impact.

Table 12. Replication impact (representative)

| Metric | Single replica | Multiple replicas | Interpretation |
|---|---|---|---|
| Throughput | Baseline | +13–34% | Overlapped execution improves utilization |
| Inter-token latency | Baseline | +~28% (avg) | Trade-off for higher throughput |
| CPU time | Baseline | −78% (two replicas) | Reduced CPU idle; improved overlap |

### Diagnostics-to-Action Mapping

Table 13 consolidates GPU-side bottleneck triage.

Table 13. GPU bottleneck matrix

| Symptom | Metrics | Cause | Mitigation |
|---|---|---|---|
| DRAM saturation | dram__bytes_read.sum high; lts__t_sector_hit_rate.pct low | Memory-bound attention; KV-cache churn | Kernel fusion; reduce bytes moved; increase concurrency (MPS) |
| Long_scoreboard stalls | smsp__warp_issue_stalled_long_scoreboard_per_warp_active.pct high | Load-to-use latency | Improve coalescing and locality; prefetch; shorten data paths |
| MIO throttle stalls | smsp__warp_issue_stalled_mio_throttle_per_warp_active.pct high | Shared memory/LSU contention | Resolve bank conflicts; double buffering; reorder tiling |
| Low achieved occupancy | smsp__warps_active.avg.pct_of_peak_sustained_active low | Memory-bound pipelines | Batch tuning; controlled replication to overlap stalls |

## Post 5 — Hardware-Accelerated Matrix Multiplication Deep Dive

Hypothesis. With iterative optimization—coalesced global loads, shared-memory tiling, warp-level tiling, vectorized accesses, and autotuning—custom GEMM kernels can reach cuBLAS-competitive performance (~94%). Roofline analysis and Nsight Compute metrics guide each step, and PTX/SASS inspection explains how low-level architectural features manifest in achieved GFLOPs/s.[^8]

Methodology. Progress from naive to optimized kernels:
1) Coalesced global loads.
2) Shared-memory caching.
3) 1D block tiling with thread-level accumulation.
4) 2D block tiling for better data reuse.
5) Vectorized loads (128-bit).
6) Autotuning parameters (BM, BN, BK; TM, TN).
7) Warp-level tiling and double buffering to overlap GMEM→SMEM→register transfers.[^8][^4][^13]

Table 14 outlines the optimization pipeline and observed performance.

Table 14. GEMM optimization pipeline (representative)

| Stage | Key change | Observed GFLOPs/s | Relative to cuBLAS |
|---|---|---|---|
| Naive | One thread computes one output | ~309 | ~1.3% |
| Global coalescing | Coalesced loads/stores | ~1,986 | ~8.5% |
| Shared-memory caching | GMEM→SMEM cache | ~2,980 | ~12.8% |
| 1D block tiling | Multiple outputs/thread | ~8,475 | ~36.5% |
| 2D block tiling | Improved register reuse | ~15,972 | ~68.7% |
| Vectorized loads | 128-bit LDG/STG | ~18,237 | ~78.4% |
| Warp tiling + double buffering | Overlap transfers, reduce bank conflicts | ~21,779 | ~93.7% |

PTX/SASS insights. Vectorized loads exploit alignment guarantees to generate LDG.E.128, increasing bytes per transaction. Shared-memory bank conflicts and MIO throttle appear when tiling expands concurrent SMEM activity; resolving conflicts via padding and reorganizing layouts reduces stalls. Autotuning selects parameters that balance register pressure, occupancy, and shared-memory throughput; double buffering hides GMEM→SMEM latency by overlapping loads with compute.[^8][^13]

Command catalog (selected):
- Nsight Compute metric collection and filtering:

```
ncu -c 1 -k sgemm_2d_tiling \
    --section MemoryWorkload \
    --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
    ./sgemm_app
```

- Disassembly and register inspection (via CUDA-GDB coredumps):

```
(cuda-gdb) target cudacore ./coredump.sgemm
(cuda-gdb) disas $errorpc,+16
(cuda-gdb) info registers $R0 $R1 $R2 $R3
```

### Autotuning and Warp Specialization

Search over parameter space (BM, BN, BK; TM, TN) to maximize GFLOPs/s while maintaining correctness and acceptable occupancy. Double buffering pipeline stages to overlap memory and compute; consider warp specialization to reduce register pressure and improve latency hiding, consistent with best practices in production libraries.[^8][^13]

## Appendix — Reproduction Guide, Command Cheat-Sheet, and Citation Map

This appendix consolidates typical commands, interpretation tips, and a citation map for metric names and diagnostic workflows.

Cheat-sheet (representative):
- ncu: collect MemoryWorkload for decode-range attention kernels and specific stalls.

```
ncu --section MemoryWorkload --nvtx --nvtx-include "decode" \
    --metrics dram__bytes_read.sum,dram__bytes_write.sum,lts__t_sector_hit_rate.pct \
    -o attention_profile ./llm_serve --model <model> --batch <N>

ncu -s 2 -c 5 -k ".*attention.*" \
    --metrics "group:MemoryWorkload" \
    ./llm_serve --model <model> --batch <N>
```

- CUDA-GDB: capture and inspect GPU coredumps.

```
CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
CUDA_COREDUMP_GENERATION_FLAGS="skip_global_memory,skip_shared_memory,skip_local_memory,skip_constbank_memory"
# Run app until crash; then:
(cuda-gdb) target cudacore /tmp/cuda_coredump.<host>.<pid>.<tid>
(cuda-gdb) info cuda kernels; disas $errorpc,+16; info registers $R0 $R1 $R2 $R3
```

- perf: syscall, scheduler, cache/TLB, memory sampling.

```
perf stat -e 'syscalls:sys_enter_*' -p PID
perf record -e L1-dcache-load-misses -c 10000 -ag -- sleep 5
perf record -e dTLB-load-misses -ag -- sleep 5
perf sched record -- sleep 1; perf sched latency; perf sched map
perf c2c record -a -- sleep 10; perf c2c report
perf mem record -- ./app; perf mem report
```

Citation map:
- MemoryWorkload sections and stall breakdowns: Nsight Compute Profiling Guide and CLI docs.[^4][^5]
- CUDA-GDB coredump usage and focus management: CUDA-GDB documentation; vLLM coredump guidance.[^3][^6]
- CPU-side analysis and perf alternatives to strace: perf examples and methodology.[^2]
- AI flame graphs: full-stack visualization of accelerator stalls and software stacks.[^7]
- GEMM optimization pipeline and metrics: iterative SGEMM optimization guide; CUTLASS pipelining best practices.[^8][^13]
- LLM memory-bound regime and replication strategies: recent bottleneck study.[^1]
- CPU–GPU interconnect tactics for KV-cache remapping: tightly coupled system strategies.[^9]
- Nsight Systems and training workflow profiling: profiling context for GPU kernels and stacks.[^10][^14]

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

[^10]: Profiling LLM Training Workflows on NVIDIA Grace Hopper. https://developer.nvidia.com/blog/profiling-llm-training-workflows-on-nvidia-grace-hopper/

[^11]: Chapter 25. Profiling memory accesses with perf mem. https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/profiling-memory-accesses-with-perf-mem_monitoring-and-managing-system-status-and-performance

[^13]: CUTLASS: Linear Algebra CUDA — NVIDIA Developer Blog. https://developer.nvidia.com/blog/cutlass-linear-algebra-cuda/

[^14]: User Guide — nsight-systems 2024.6. https://docs.nvidia.com/nsight-systems/2024.6/UserGuide/index.html

---

Information gaps acknowledged:
- Large-volume raw ncu reports and full PTX/SASS disassembly are not included; representative commands and metric interpretations are provided for replication.
- perf memory event semantics differ across CPU generations; adapt event lists to your hardware.
- On-device (mobile) profiling constraints limit low-level OS tracing; focus on desktop/server Linux for reproducibility.