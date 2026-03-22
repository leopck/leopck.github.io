# Expansion Plan V2: All Series to 30+ Posts + 3 New Series

## Existing Series Gaps

| Series | Current | Target | Gap | Strategy |
|--------|---------|--------|-----|----------|
| Transformer Anatomy | 36 | 30 | DONE | No action needed |
| Inference Timeline | 40 | 30 | DONE | No action needed |
| vLLM (merged Internals + v1) | 16 | 30 | 14 | Merge into single "vLLM Deep Dive" series |
| NVIDIA Dynamo & llm-d | 14 | 30 | 16 | Expand with more operational + advanced topics |
| MoE Masterclass | 4 | 30 | 26 | Massive expansion: routing algorithms, training, specific architectures |
| Frontier Architectures | 3 | 30 | 27 | Cover every major 2024-2026 model in depth |
| Dataset Frontier | 15 | 30 | 15 | Add more specialized data topics |
| Frontier Research | 15 | 30 | 15 | Add more research areas |

## New Series to Create (30 posts each)

### Quantization Masterclass (30 posts)
FP8 E4M3/E5M2, NVFP4, MXFP4, INT8, INT4, W4A16, W8A8, GPTQ, AWQ,
SmoothQuant, per-tensor/per-channel/per-group scaling, calibration,
hardware support matrix, quantization-aware training, mixed-precision
inference, KV cache quantization, activation quantization

### CUDA Kernel Engineering (30 posts)
Kernel launch, thread hierarchy, shared memory, registers, warp primitives,
memory coalescing, bank conflicts, occupancy, tensor cores, CUTLASS,
Triton, kernel fusion, profiling with nsight, CUDA graphs, cooperative
groups, dynamic parallelism, streams, events, atomics, reduction patterns

### GPU Hardware & AI Accelerators (30 posts)
NVIDIA Volta/Ampere/Hopper/Blackwell architecture, tensor core evolution,
HBM generations, NVLink/NVSwitch, PCIe, AMD MI300X, Intel Gaudi, Google TPU,
power management, thermal throttling, MIG, GPU virtualization, memory
hierarchy, cache behavior, scheduling hardware, warp schedulers

## Total New Posts Needed: ~143 existing gaps + 90 new series = ~233
## Realistic target: write in batches, prioritize depth over breadth
