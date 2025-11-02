---
author: Fridays with Faraday
category: gaudi
description: Deep technical analysis of Gaudi AI accelerator architecture, memory
  subsystem, and optimization strategies.
difficulty: advanced
layout: post
reading_time: 1
show_author: true
show_categories: true
show_date: true
show_reading_time: true
show_related_posts: true
show_share_buttons: true
show_tags: true
tags:
- optimization
- hbm
- ai-accelerator
- memory
- gaudi
title: Gaudi2 Architecture Deep Dive for AI Workloads
toc: true
---

# Gaudi2 Architecture Deep Dive for AI Workloads

## Executive Summary: What Gaudi2 Is and Why It Matters

Intel’s Gaudi2 is a second-generation AI training accelerator built around a deliberate separation of concerns: a configurable Matrix Multiplication Engine (MME) optimized for GEMMs and convolutions, and a programmable Tensor Processor Core (TPC) for everything else. The result is a system architected for throughput, scalability, and predictable behavior under production workloads, rather than a monolithic, general-purpose shader array. The design choice matters because it aligns hardware data paths, control primitives, and memory hierarchy tightly with the real bottlenecks in deep learning training: matrix arithmetic, data movement, and interconnects for scale-out.

In practical terms, Gaudi2 pairs a high-capacity, high-bandwidth memory subsystem (96 GB HBM2e at roughly 2.45 TB/s, plus 48 MB of on-die SRAM) with an integrated, scale-out Ethernet networking fabric (24 ports of 100 Gbps RoCE v2) to deliver both device-level and cluster-level efficiency. This dual-path approach—compute specialization plus integrated networking—reduces dependence on external NICs for scale-up/scale-out and provides deterministic paths for collective communications in large clusters[^1].

At the die level, compute is clustered into Deep Learning Cores (DCOREs), each containing 2x MME, 16x TPC, and a 24 MB cache. The MMEs employ a large, output-stationary systolic array (256x256 MAC structure) with FP32 accumulators and integrated address generation units (AGUs), while the TPCs use a VLIW SIMD architecture with four slots (Vector, Scalar, Load, Store) and their own AGUs to drive efficient, strided, and tensor-shaped data movement. The memory hierarchy is unified at the L2/L3/HBM level, with explicit cache directives (No-$, L2$, L3$, L2$+L3$) and Memory Context ID (MCID) mechanisms that allow software to steer cache policy and residency for different algorithmic phases[^4][^5].

To ground the discussion, Figure 1 shows the Gaudi3 architecture (used as a conceptual proxy for Gaudi2’s organization), with DCOREs, the control path, and the networking fabric. The same clustering and control primitives apply to Gaudi2, which shares the overall architectural philosophy while differing in generation-specific specs (e.g., HBM capacity, SRAM, PCIe generation, and NIC bandwidth).

![Gaudi high-level block diagram (used as architectural context)](.pdf_temp/viewrange_chunk_1_1_5_1762065676/images/x5a5xi.jpg)

Table 1 summarizes Gaudi2’s salient specifications most relevant to system performance analysis. The figures contextualize the hardware’s ability to sustain high-throughput training and inference, and they frame the bottlenecks we will examine in later sections.

Table 1: Gaudi2 key specifications and implications

| Specification | Gaudi2 Value | Practical Implication |
|---|---|---|
| HBM2e Capacity | 96 GB | Larger per-device model or batch capacity; fewer devices required for a given model size[^1] |
| HBM2e Bandwidth | ~2.45 TB/s | Sustained read/write rates for GEMMs and activations; informs tensor shape and batch sizing[^1] |
| On-die SRAM | 48 MB | Fast scratch for tiling, transposes, and partials; mitigates HBM pressure[^1] |
| Embedded NIC | 24x 100 GbE RoCE v2 (≈4.8 Tb/s bidirectional) | Integrated RDMA reduces hop count and improves all-reduce/collective cost at scale[^1] |
| Host Interface | PCIe Gen4 x16 (≈64 GB/s bidirectional) | Host–device transfer ceiling; implications for data loading, checkpointing[^3] |
| Media Engines | Integrated decoders (HEVC/H.264/JPEG/VP9) | Offloads pre-processing; reduces host CPU overhead[^1] |

In the sections that follow, we analyze the driver-level control path (Submission/Completion Queues, Sync Manager, Interrupt Manager), the register-level programming model (primarily via device configuration and TPC intrinsics), the memory hierarchy (HBM, SRAM, unified L2/L3, cache directives), and the networking subsystem (integrated RoCE v2). We then detail DMA and PCIe behaviors and touch on firmware-mediated engine synchronization and power/cooling form factors. Throughout, we draw on Gaudi3 architecture to explain mechanisms that generalize across generations where design intent is unchanged[^4][^5].


## System Overview and Logical Topology

Gaudi2’s system-on-chip (SoC) is organized into four DCOREs. Each DCORE contains 2 MME engines, 16 TPC cores, and a 24 MB cache. This clustering is not merely a floorplanning convenience; it expresses an intentional locality principle: tensor cores and their working sets remain close to dedicated cache and near-memory compute, reducing cross-die traffic and easing synchronization at task boundaries[^4][^5].

The host interface is PCIe Gen4 x16, offering approximately 64 GB/s bidirectional bandwidth. While modern servers can saturate this link, workload characteristics (e.g., activation checkpointing, gradient accumulation, and host-side data loading) determine whether the PCIe path becomes the limiting factor. Gaudi2 integrates 24 100 Gbps RoCE v2 NIC ports directly on the accelerator die, providing both scale-up (card-to-card within a node) and scale-out (rack-to-rack) paths without requiring discrete host NICs for collectives. This architecture reduces latency and improves bandwidth predictability for inter-accelerator traffic[^1][^3].

![Gaudi3 baseboard/card topology reference (Gaudi2 shares networking concepts)](.pdf_temp/viewrange_chunk_2_6_10_1762065678/images/1e4znz.jpg)

Table 2 lists the host interface and expected throughput across generations. The shift from PCIe Gen4 to Gen5 roughly doubles peak host bandwidth, but for Gaudi2, the Gen4 ceiling remains the operational constraint.

Table 2: Host interface comparison and practical throughput expectations

| Product Generation | PCIe Generation | Lanes | Peak Bidirectional Bandwidth | Observed/Expected Ranges |
|---|---|---|---|---|
| Gaudi | Gen3 | x16 | ~64 GB/s | Varies by platform; typically below peak due to overhead[^3] |
| Gaudi2 | Gen4 | x16 | ~64 GB/s | Near-peak feasible; dependent on CPU, BIOS, slot, and workload[^3] |
| Gaudi3 | Gen5 | x16 | ~128 GB/s | Higher ceilings; improved host–device pipelines[^3] |

Form factor matters for system design. Gaudi2 appears in OCP Accelerator Module (OAM) and PCIe CEM variants. The OAM path typically enables higher device power and a richer set of on-board networking ports, while the PCIe add-in card trades some networking flexibility for compactness and ease of integration in existing host platforms. Table 3 summarizes form factor and typical power envelopes[^3].

Table 3: Form factor and power characteristics

| Form Factor | Typical Use | Power Envelope (TDP) | Notes |
|---|---|---|---|
| OAM (e.g., HL-325L) | Server-grade baseboards with on-board scaling fabric | Up to 900 W (air), up to 900–1200 W (liquid depending on generation) | 24x 100 GbE (Gaudi2) integrated NIC; card-to-card and scale-out[^3] |
| PCIe CEM (e.g., HL-338) | Add-in accelerator cards | Up to 600 W (passive) | Scale-up via top board; scale-out via host NIC[^3] |

The distinction is not academic. When building multi-device systems, topology influences both latency (fewer hops for device–device traffic) and throughput (more bisection bandwidth on-board). The baseboard’s physical layout governs whether the NIC fabric becomes the bottleneck or an enabler for model and data parallel strategies[^3].


## Compute Architecture: MME and TPC in Detail

Gaudi2’s compute plane is intentionally bifurcated. The MME is a configurator’s arithmetic engine: you describe the operation and tensor shapes; the hardware performs the matrix multiply using a large, output-stationary systolic array with deeply pipelined dataflows. The TPC is the programmer’s arithmetic engine: a VLIW SIMD core with explicit vector, scalar, load, and store pipelines, augmented by AGUs and local memory for flexible, non-GEMM workloads.

The MME’s 256x256 MAC array, FP32 accumulators, and AGU-based address generation allow it to handle fully connected layers, convolutions, and batched GEMMs efficiently. Its integrated transpose engines remove a common source of overhead when reshaping activations, and its internal buffers serve as a functional L1 replacement by reusing inputs in-place. The TPC fills in everything else: element-wise ops, normalization layers, activations, reductions, and custom ops. The slot-based VLIW design (Vector, Scalar, Load, Store) ensures that, with careful scheduling, memory latency and bandwidth can be overlapped with compute[^4][^5].

![MME block diagram: systolic array, pipelines, and AGU](.pdf_temp/viewrange_chunk_2_6_10_1762065675/images/engwyx.jpg)

![TPC block diagram: VLIW pipelines, vector register file, and local memory](.pdf_temp/viewrange_chunk_2_6_10_1762065675/images/9trflq.jpg)

Table 4 compares the MME and TPC feature sets from a programmer’s perspective.

Table 4: Feature comparison — MME vs. TPC

| Feature | MME | TPC |
|---|---|---|
| Role | GEMM/convolution engine | Programmable SIMD for non-GEMM ops |
| Programmability | Configurable via descriptors | Programmable in C with TPC intrinsics |
| Core Structure | 256x256 systolic, output-stationary | VLIW with 4 slots (Vector, Scalar, Load, Store) |
| Accumulator Precision | FP32 | FP and integer types supported by kernel |
| Data Types | BF16/FP8 MAC with FP32 accum; convert on write | 1/2/4-byte FP and integer types |
| Address Generation | Integrated AGU for 5-D tensors, OOB handling | Load/Store slot AGUs for 5-D tensors |
| Local Memory | Internal buffers for input reuse | 80 KB vector local memory (VLM) |
| Throughput Drivers | Transpose engines; parallel read/compute/write | Latency hiding; high-width vector lane |
| Typical Ops | Matmul, convolution, batched GEMM | Element-wise, reductions, norm, activations |

### MME Programming and Dataflows

At register level, the MME is configured rather than programmed in microcode. The driver and firmware agree on a descriptor that defines tensor shapes, precision, strides, transpose flags, and boundary behaviors (e.g., out-of-bounds padding). The hardware’s systolic dataflow ensures that, once filled, the array produces output tiles with minimal stall and high reuse of on-chip data. A critical nuance is the AGU’s role in 5-D addressing: by offloading bounds checking and padding, the MME avoids special-casing in software and supports generic tensor layouts in compiled graphs. The integrated transpose engines reduce data preparation overhead by transforming input tiles as they enter the compute pipeline[^4].

### TPC Programming Model

The TPC’s programming model exposes the VLIW nature directly: kernels schedule instructions across the Vector, Scalar, Load, and Store slots. The Load and Store slots include AGUs for 5-D addressing, making strided, indirect, or padded access patterns first-class citizens. The vector register file and 80 KB VLM provide data locality that is both programmer-visible and compiler-manageable. Latency hiding is part of the microarchitecture, but practical throughput depends on kernel authors explicitly overlapping memory operations with compute and on the compiler’s ability to orchestrate slot utilization[^5].

The public documentation for TPC intrinsics and the precise instruction encoding is not fully available via standard doc pages. Users rely on the TPC Kernel Libraries and custom kernel repositories to build and integrate kernels, using the provided compiler, assembler, and simulator toolchain[^12][^13][^14][^15].


## Memory Hierarchy and Cache Behavior

Gaudi2’s memory subsystem is unified across L2, L3, and HBM, with uniform HBM mapping via the MMU. Each DCORE includes a 24 MB L2 cache; L3 is uniformly distributed across DCOREs. This arrangement places significant, near-compute capacity close to the MMEs and TPCs while preserving a coherent, uniform view of memory for software. The on-die SRAM (48 MB in Gaudi2) complements L2/L3 as a high-bandwidth, low-latency scratch that can be explicitly steered by cache directives[^1][^4][^5].

![Memory subsystem logical view with unified L2/L3/HBM](.pdf_temp/viewrange_chunk_2_6_10_1762065675/images/ekgysp.jpg)

Gaudi introduces two mechanisms that matter greatly to performance portability: cache directives and MCID-based cache management. Cache directives—No-$, L2$, L3$, and L2$+L3$—let the compiler/runtime hint or dictate where data should reside, while MCID tags cache lines with a context identifier tied to algorithmic phases or shared uses. Discard invalidates all lines with a given MCID; Degrade resets their hit counts, which can be useful to reduce pollution from hot lines that are no longer structurally reusable[^4][^5].

Table 5 summarizes the memory hierarchy and bandwidth expectations by generation.

Table 5: Memory hierarchy summary and bandwidth

| Generation | HBM Capacity | HBM Bandwidth | On-Die SRAM | SRAM/L2 Bandwidth | Cache Organization |
|---|---|---|---|---|---|
| Gaudi | 32 GB | ~0.9 TB/s | — | — | L2/L3 per DCORE (generation-specific) |
| Gaudi2 | 96 GB | ~2.45 TB/s | 48 MB | ~6.4 TB/s read / ~6.4 TB/s write (L2 cache) | L2 per DCORE (24 MB); L3 distributed[^1] |
| Gaudi3 | 128 GB | ~3.7 TB/s | 96 MB | ~12.8 TB/s read / ~6.4 TB/s write | L2 per DCORE (24 MB); L3 distributed[^4][^5] |

Table 6 frames the cache directives and MCID operations and when to apply them.

Table 6: Cache directives and MCID operations

| Mechanism | Purpose | When to Use | Effect | Cautions |
|---|---|---|---|---|
| No-$ | Bypass caches | Large, streaming or write-once tensors | Avoid cache pollution | May increase HBM traffic |
| L2$ | Favor L2 residency | Tiles re-used within a DCORE | Low-latency hits in local DCORE | May evict other working sets |
| L3$ | Favor distributed L3 | Cross-DCORE reuse patterns | Broader reuse without HBM | Coordination needed for coherence |
| L2$+L3$ | Dual residency | Producer–consumer across DCOREs | Balanced latency/bandwidth | Larger footprint; watch eviction |
| MCID: Discard | Invalidate lines | Phase transitions | Clears stale hot lines | Data must be regenerated/reloaded |
| MCID: Degrade | Reset hit counts | Retain lines but reduce prominence | Mitigate false sharing of hot sets | Requires careful measurement |

In practice, tensor layout, tiling strategy, and cache directive selection determine whether the working set fits in on-die SRAM/L2 or spills to HBM. The integrated near-memory compute (Add/Sub/Max/Min) can further reduce round trips by performing reductions close to data, particularly for normalization and activation aggregation steps[^4][^5].


## Control Path, Submission/Completion, and Firmware Interactions

Gaudi’s control path is a programmable, low-latency, high-throughput subsystem designed to orchestrate parallel execution across MMEs, TPCs, the NIC, and media engines. Its core primitives—Submission Queues (SQs), Completion Queues (CQs), Sync Manager (SM), and Interrupt Manager (INTR)—expose a minimal, composable interface to the driver stack[^4].

The driver constructs jobs and dependencies, writes work descriptors to SQs, and waits on completions posted to CQs. The Sync Manager tracks hardware events and dependencies, dispatching work to the right engine and gating start-of-job until inputs are ready. The Interrupt Manager marshals asynchronous events back to the kernel driver with minimal latency.

![Control Path block diagram: SQ/CQ, Sync Manager, Interrupt Manager](.pdf_temp/viewrange_chunk_2_6_10_1762065676/images/tmofmm.jpg)

Table 7 maps control path components to their functions and typical driver interactions.

Table 7: Control path components and driver interactions

| Component | Function | Driver Interaction |
|---|---|---|
| Submission Queue (SQ) | Enqueue engine jobs and descriptors | Map buffers, write job control blocks, ring doorbells |
| Completion Queue (CQ) | Receive completion and status events | Poll or wait on CQ entries; read status/errors |
| Sync Manager (SM) | Manage dependencies and dispatch | Configure event counts and gating conditions |
| Interrupt Manager (INTR) | Signal asynchronous events | Register ISR/thread handlers; mask/unmask sources |

The separation of submission/completion from synchronization mirrors classical hardware–software co-design: the driver orchestrates data movement (via DMA and cache directives), while the control path ensures compute engines only start when data is ready and other dependencies are satisfied. This keeps critical paths simple, debuggable, and efficient[^4].


## Driver Internals: Linux Kernel and User Mode Stack

The Linux kernel driver for Gaudi devices exposes the device via a char driver interface, creates device nodes, and integrates with DMA and interrupt subsystems. User-space interacts through a User Mode Driver (UMD) that forwards graph jobs and kernel invocations to the kernel driver. The graph compiler sits above the UMD, determining engine assignments, MME configurations, and TPC kernel launch ordering, as well as collective communication strategies via HCCL (Habana Collective Communication Library)[^4][^12].

Table 8 outlines the kernel-to-user call path.

Table 8: Kernel-to-user call path

| Layer | Responsibility | Examples |
|---|---|---|
| Kernel Driver (KMD) | Device initialization, MMIO, DMA mapping, interrupts | PCI enumeration, SQ/CQ doorbells, ISR handling |
| UMD | User-space API, job submission, runtime coordination | Graph execution, kernel launching |
| Graph Compiler | Static scheduling, engine partitioning, fusion | MME vs TPC assignment, cache directive insertion |
| HCCL | Collective operations over integrated NIC | All-reduce, broadcast, barrier |

While public documentation explains the software layering and responsibilities, precise register map details and performance counter interfaces are not comprehensively published. Those are left to firmware Interface Design Specification (IDS) and driver source review for exact fields and semantics[^12].


## Register-Level Programming and MMIO View

At the register level, Gaudi exposes control through memory-mapped I/O (MMIO) registers and queue structures. In broad strokes, the driver maps PCI BARs, configures SQ/CQ rings, writes job descriptors (or configuration blocks for the MME), arms interrupts, and monitors status registers. The TPC’s programmable interface is accessed through intrinsics, and its instructions are not directly exposed to the driver in the same way as scalar device registers; the UMD and toolchain manage TPC binary loading and invocation[^4][^11].

Table 9 sketches a conceptual register map.

Table 9: Conceptual MMIO regions and usage

| Region | Purpose | Driver Usage |
|---|---|---|
| Global Control | Device-level enable, resets, power/clock controls | Initialize/finalize device; handle errors |
| SQ/CQ Registers | Head/tail pointers, doorbells, enable masks | Enqueue jobs; notify device; poll/mask completions |
| Interrupt Control | Event sources, masks, status | Register handlers; clear pending events |
| DMA Engine | SGL/base/len, channel control, status | Map SG lists; initiate transfers; check completion |
| MME Config | Tensor shapes, strides, precision, transpose | Write descriptor; arm compute; read status |
| TPC Control | Kernel load, start/stop, stream config | Load kernel; configure launching context |

Without a public IDS, the exact register offsets, bitfields, and sequencing constraints are not fully documented. However, the driver architecture and queue-based job submission model are consistent with the control path’s design[^4][^11].


## DMA Engine and Data Transfer Mechanics

Gaudi integrates multiple DMA engines and AGUs to orchestrate data movement in parallel with compute. AGUs embedded in the MME and TPCs support 5-D addressing, out-of-bounds padding, and write prevention, which reduces branchy per-element checks and enables cleaner, higher-throughput kernels. The DMA API used by the driver follows the Linux DMA mapping patterns: drivers allocate coherent or streaming buffers, build scatter–gather lists, and manage synchronization fences appropriate to the transfer type[^4][^17].

Table 10 summarizes DMA patterns and typical Linux API usage.

Table 10: DMA patterns and APIs

| Pattern | Use Case | Linux API Examples | Notes |
|---|---|---|---|
| Host→Device (H2D) | Load weights, inputs | dma_map_single(), dma_sync_single_for_device() | Cache invalidation on device |
| Device→Host (D2H) | Retrieve results | dma_map_single(), dma_sync_single_for_cpu() | Cache writeback on host |
| Device↔Device (D2D) | Tile movement, pre-processing | dmaengine_prep_slave_sg() | On-die SRAM/L2/L3 placement |
| Bidirectional | Pipelined transfers | As above, plus fences | Overlap compute and transfer |

The key to peak throughput is overlapping transfers and compute using SQ/CQ signaling and Sync Manager gating so that engines only start when their inputs are resident and ready[^4].


## PCIe Transactions and Bottleneck Analysis

The host interface is PCIe Gen4 x16 for Gaudi2. Real-world throughput depends on NUMA locality, CPU PCIe topology, BIOS settings, and concurrent traffic from other devices. Use the hl_thunk bandwidth test plugin to measure PCIe, HBM, and on-die SRAM bandwidth on your platform. The plugin provides expected ranges and pass/fail thresholds (commonly a 10% degradation criterion) to determine whether the platform is performing within spec[^6].

Table 11 outlines measured ranges and how to interpret them.

Table 11: PCIe expected ranges and hl_qual thresholds

| Platform | Direction | Expected (approx.) | Notes |
|---|---|---|---|
| Gaudi2 Gen3 CPU path | H2D | ~11.9 GB/s | Baseline Gen3 x16[^6] |
| Gaudi2 Gen3 CPU path | D2H | ~12.9 GB/s | Baseline Gen3 x16[^6] |
| Gaudi2 Gen3 | Bidirectional | ~19.5 GB/s | Not double of uni-directional[^6] |
| Gaudi2 Gen4 (PCI test) | H2D | ~20.9 GB/s | Gen4 x16 path[^6] |
| Gaudi2 Gen4 (PCI test) | D2H | ~23.1 GB/s | Gen4 x16 path[^6] |
| Gaudi2 Gen4 (PCI test) | Bidirectional | ~34.6 GB/s | Concurrent upload+download[^6] |
| Gaudi3 Gen5 | H2D | ~39.4 GB/s | For comparison[^6] |
| Gaudi3 Gen5 | D2H | ~38.8 GB/s | For comparison[^6] |
| Gaudi3 Gen5 | Bidirectional | ~80.4 GB/s | For comparison[^6] |

When PCIe becomes the bottleneck, performance symptoms include reduced tokens/s in inference or elongated step times in training. Remedies include:

- Improve NUMA locality: attach devices to the same NUMA node as the data loader and application threads.
- Increase host page size (e.g., 2 MB/1 GB huge pages) to reduce TLB pressure and improve scatter–gather efficiency.
- Minimize concurrent PCI traffic by pinning device interrupts and isolating CPUs.
- Coalesce small transfers into larger SG entries to reduce per-transfer overhead.

Table 12 lists common mitigations.

Table 12: PCIe bottleneck mitigation checklist

| Symptom | Likely Cause | Mitigation |
|---|---|---|
| Tokens/s fluctuates with batch size | Small, frequent transfers | Batch H2D/D2H; larger SG entries |
| Step time spikes during checkpointing | Concurrent PCIe traffic | Isolate CPUs; migrate workloads |
| PCIe below expected on Gen4 | BIOS settings, retimers | Update firmware; verify PCIe config |
| Elevated tail latency | NUMA mismatch | Rebind devices, threads to NUMA |


## Hardware Counters and Performance Instrumentation

Public documentation confirms the presence of performance-critical counters and the hl_thunk qualification library for bandwidth tests, but it does not enumerate counter names, bit widths, or register offsets. In practice, developers should:

- Use vendor-provided qualification and profiling tools to collect device-side and PCIe-level metrics.
- Cross-check host-side perf events (e.g., CPU cycles, cache misses) against device-side counters for phase alignment.
- Leverage the graph compiler’s logging to reason about cache directive placement, engine scheduling, and potential hotspots[^6][^12].

The absence of a public counter registry is an information gap that limits fine-grained analysis without access to internal specs or NDA driver documentation.


## Firmware Interactions and Engine Synchronization

Firmware mediates engine scheduling and synchronization via the Sync Manager. The driver expresses dependencies as counted events (e.g., “DMA for tile A completes,” “MME stage 1 finishes”), and firmware dispatches dependent work only when conditions are satisfied. This offloads critical-path synchronization from software and reduces jitter under heavy load[^4].

Table 13 shows typical dependency patterns.

Table 13: Engine synchronization patterns

| Producer | Consumer | Dependency | Sync Point |
|---|---|---|---|
| DMA H2D | MME | Input tile ready | SQ + SM event |
| MME | TPC | Activation tile ready | CQ completion |
| TPC | DMA D2H | Result tile ready | CQ completion |
| NIC (All-Reduce) | MME/TPC | Gradient shard ready | NIC completion event |

Near-memory compute can sometimes eliminate a producer–consumer hop by performing reductions adjacent to data (e.g., across tiles in SRAM/L2), reducing cross-engine traffic and synchronization overhead[^4][^5].


## Power and Thermal Management at Register/Form Factor Level

Form factor and cooling choices are first-order constraints. OAM modules support up to 900 W (air) and up to ~1200 W (liquid) depending on generation, while PCIe CEM cards target up to ~600 W passive. Side-band interfaces such as I2C and JTAG support board management controller (BMC) integration, telemetry, and field diagnostics. Although register-level power management details (e.g., clock gating and DVFS registers) are not publicly enumerated, the overall power envelope and thermal envelope follow directly from the form factor and cooling solution[^3][^4][^5].

![OCP baseboard and card features relevant to power/thermal delivery](.pdf_temp/viewrange_chunk_2_6_10_1762065678/images/m5hn1d.jpg)

Table 14 summarizes power/form factor/cooling relationships.

Table 14: Form factor vs. power vs. cooling

| Form Factor | TDP | Cooling | Notes |
|---|---|---|---|
| OAM (Gaudi2) | Up to 900 W | Air | Integrated NIC fabric on-baseboard[^3] |
| OAM (Gaudi3) | Up to 900–1200 W | Air/Liquid | Higher power, 24x 200 GbE NIC[^4][^5] |
| PCIe CEM | Up to 600 W | Passive | Scale-up via top board; scale-out via host NIC[^3] |


## Appendix A: Glossary

- MME (Matrix Multiplication Engine): Configurable, systolic array engine for GEMMs and convolutions.
- TPC (Tensor Processor Core): Programmable VLIW SIMD processor for non-GEMM operations.
- DCORE (Deep Learning Core): Cluster of 2x MME, 16x TPC, and 24 MB cache.
- SQ/CQ (Submission/Completion Queues): Control path primitives for job submission and completion.
- Sync Manager (SM): Hardware mechanism to gate and dispatch work based on counted events.
- Interrupt Manager (INTR): Hardware mechanism for asynchronous event signaling to the driver.
- MCID (Memory Context ID): Tagging mechanism for cache lines; enables Discard/Degrade operations.
- AGU (Address Generation Unit): Hardware address calculator for 5-D tensors, OOB padding, write prevention.
- HBM (High Bandwidth Memory): Stacked DRAM memory with high bandwidth.
- VLM (Vector Local Memory): TPC’s local on-chip memory for vector data.


## Appendix B: Methodological Notes

- Architecture continuity: Gaudi3 documentation is used to explain mechanisms that are consistent across Gaudi2 and Gaudi3 (e.g., DCORE clustering, control path primitives). Where specific numbers differ (HBM capacity/bandwidth, PCIe generation, NIC speeds), we explicitly note the generation.
- Information gaps: The public domain does not include a complete Gaudi2 register map (offsets, bitfields), detailed performance counter registry, or a full TPC intrinsics/spec document. These are available in limited internal/firmware IDS and driver sources but not in public documentation[^12][^14][^15][^17].
- Observability: Use the hl_thunk bandwidth tests and vendor profiling tools; corroborate host-side perf with device-side metrics to triangulate bottlenecks[^6][^12].


## References

[^1]: Gaudi Architecture — Habana Documentation. https://docs.habana.ai/en/latest/Gaudi_Overview/Gaudi_Architecture.html

[^2]: Intel Gaudi 3 AI Accelerator White Paper. https://cdrdv2-public.intel.com/817486/gaudi-3-ai-accelerator-white-paper.pdf

[^3]: Habana Gaudi Customer Enablement Whitepaper (OAM/PCIe Form Factors, Interfaces). https://cdrdv2-public.intel.com/784833/Gaudi%20Amazon%20EC2%20DL1%20Instances.pdf

[^4]: Intel Gaudi 3 AI Accelerator — Hot Chips 2024. https://hc2024.hotchips.org/assets/program/conference/day1/60_HC2024.Intel.RomanKaplan.Gaudi3-0826.pdf

[^5]: Intel Gaudi 3 AI Accelerator — 30-3-30 Overview. https://cdrdv2-public.intel.com/845118/gaudi-3-ai-accelerator-30-3-30.pdf

[^6]: Bandwidth Test Plugins Design — hl_thunk. https://docs.habana.ai/en/latest/Management_and_Monitoring/Qualification_Library/Bandwidth_Tests_Plugin.html

[^7]: Stacking Up Intel Gaudi Against Nvidia GPUs For AI — The Next Platform. https://www.nextplatform.com/2024/06/13/stacking-up-intel-gaudi-against-nvidia-gpus-for-ai/

[^8]: Intel Gaudi 3 vs. Nvidia H100: Enterprise AI Inference — FiberMall. https://www.fibermall.com/blog/intel-gaudi3-vs-nvidia-h100.htm

[^9]: LLM Training and Inference with Intel Gaudi 2 AI Accelerators — Databricks Blog. https://www.databricks.com/blog/llm-training-and-inference-intel-gaudi2-ai-accelerators

[^10]: Intel Begins Publishing Habana Labs Gaudi2 Linux Driver Code — Phoronix. https://www.phoronix.com/news/Intel-Gaudi2-Linux-Driver

[^11]: Linux v6.6.1 — drivers/accel/habanalabs/gaudi/gaudi.c — rabexc.org. https://sbexr.rabexc.org/latest/sources/2e/8a27c3bf394e0b.html

[^12]: Kernel Libraries — Intel Gaudi Developers. https://developer.habana.ai/get-started/kernel-libraries/

[^13]: TPC Tools Installation Guide — Habana Docs. https://docs.habana.ai/en/latest/TPC_Tools_Installation/TPC_Tools_Installation_Guide.html

[^14]: TPC User Guide — Habana Docs. https://docs.habana.ai/en/latest/TPC_User_Guide/TPC_User_Guide.html

[^15]: TPC Debugger User Guide — Habana Docs. https://docs.habana.ai/en/latest/TPC_Debugger/TPC_Debugger_User_Guide.html

[^16]: TensorFlow Custom OP Framework — Habana Docs. https://docs.habana.ai/en/latest/TensorFlow_Operators/TF_Operators.html

[^17]: Dynamic DMA mapping Guide — Linux Kernel Documentation. https://docs.kernel.org/core-api/dma-api-howto.html

[^18]: PyTorch Mixed Precision — Intel Gaudi Developers. https://developer.habana.ai/tutorials/pytorch-lightning/pytorch-mixed-precision/

[^19]: Intel Gaudi — Hugging Face Optimization Guide. https://huggingface.co/docs/diffusers/optimization/habana