# Expansion Plan: 100+ New Posts Across All Series

## Target: ~100 new posts bringing total from 102 to ~200

### Transformer Anatomy (15 existing + 20 new = 35 total)
New posts (seriesOrder 16-35):
16. Gradient Flow and Backpropagation Through Transformers
17. Weight Initialization: Xavier, Kaiming, and Why mu-P Changes Everything
18. Training Loop Anatomy: Forward, Loss, Backward, Optimizer Step
19. Learning Rate Schedules: Warmup, Cosine Decay, and WSD
20. Distributed Data Parallel: Gradient Synchronization at Scale
21. Activation Functions Deep Dive: From ReLU to SiLU to GELU
22. Dropout and Regularization in Transformers
23. Attention Masking: Causal, Bidirectional, Sliding Window, Block Sparse
24. Multi-Query vs Multi-Head: The Inference-Training Quality Tradeoff
25. Token Prediction Heads: Next-Token, Multi-Token, Classifier Heads
26. Mixture of Depths: Conditional Computation Per Layer
27. Sparse Attention Patterns: Local, Strided, Hash-Based, Learnable
28. Rotary Position Embedding: The Complete Mathematical Derivation
29. Knowledge Distillation: Training Small Models from Large Ones
30. Model Merging: Averaging Weights, TIES, DARE, and Evolutionary
31. Tensor Decomposition: Low-Rank Approximation for Compression
32. Pruning at Scale: SparseGPT, Wanda, and Structured Removal
33. Checkpoint Formats: safetensors, GGUF, TensorRT Engines
34. Model Sharding: How to Split a Transformer Across Devices
35. The Transformer in 2026: What Changed and What's Next

### Inference Optimization Timeline (15 existing + 20 new = 35 total)
New posts (seriesOrder 16-35):
16. Model Loading and Cold Start Optimization
17. Batched GEMM: Why Matrix Multiply Throughput Determines Everything
18. Kernel Autotuning: How TensorRT and torch.compile Find Optimal Kernels
19. Attention Kernel Comparison: FlashAttention vs FlashInfer vs xformers
20. Token Generation Pipeline: Logit Processing, Sampling, Stop Criteria
21. Dynamic Batching: Orca, Sarathi, and Iteration-Level Scheduling
22. Memory Pool Management: Slab Allocators for GPU Inference
23. Prefill Optimization: Chunked Prefill, Prefix-Aware Scheduling
24. Decode Optimization: CUDA Graphs, Persistent Batches, Speculative
25. Multi-Model Serving: GPU Sharing, Model Switching, Adapter Pools
26. Structured Output Acceleration: Compressed FSMs, Speculative JSON
27. Vision-Language Model Serving: ViT Encoding, Cross-Attention, Paging
28. Long-Context Serving: Ring Attention, KV Offloading, Chunked Processing
29. Inference Profiling: Nsight, torch.profiler, Identifying Bottlenecks
30. FP8 Inference: E4M3, Per-Tensor Scaling, Hardware Support Matrix
31. Speculative Decoding v2: Medusa, EAGLE, Lookahead, Token Trees
32. Disaggregated Serving v2: Mooncake, LoongServe, Elastic SP
33. Request Preemption and Priority Scheduling in Production
34. Autoscaling LLM Inference: Signals, Lag, Warm Pools
35. The Inference Stack in 2026: From Request to Response

### vLLM v1 & Omni Internals (2 existing + 10 new = 12 total)
New posts (seriesOrder 3-12):
3. OmniConnector: Async Multimodal Token Lifecycle
4. vLLM v1 Unified Scheduler: One Queue to Rule Them All
5. vLLM v1 Attention Backends: FlashAttention, FlashInfer, PagedAttention
6. Rejection Sampler: Native CFG and Alignment During Generation
7. vLLM v1 CUDA Graph Dispatcher: Dynamic Shape Handling
8. vLLM v1 Tensor Parallelism: Symmetric Workers and Incremental Updates
9. vLLM v1 Structured Output: Native Grammar Engine
10. vLLM Prefix Caching: Hash Chains, Eviction, and Hit Rate Optimization
11. vLLM Multi-LoRA: Adapter Scheduling and Memory Management
12. vLLM Performance Profiling: Finding Bottlenecks in Production

### NVIDIA Dynamo & llm-d (4 existing + 10 new = 14 total)
New posts (seriesOrder 5-14):
5. llm-d Declarative Framework: From YAML to Optimized Execution
6. Dynamo Fault Tolerance: Canary Health Checks and Request Migration
7. Dynamo Multi-Model Serving: GPU Sharing and Model Priority
8. Dynamo for Multimodal: Video/Audio Routing and Encoder Scheduling
9. Dynamo Cost Optimizer: Spot Instances, Reserved, and Burst Strategy
10. Blackwell GB200 NVL72: Architecture and Dynamo Integration
11. Dynamo Observability: Distributed Tracing, Metrics, Alerting
12. Dynamo vs SGLang Router: Architectural Comparison
13. Dynamo for MoE: Expert-Aware Routing and EP Integration
14. Building a Mini-Dynamo: A 500-Line Python Router

### The Dataset Frontier (2 existing + 10 new = 12 total)
New posts (seriesOrder 3-12):
3. Agent-Based Simulation: 10K Agents Generating Synthetic Transaction Data
4. Reasoning Trace Generation: Self-Correction Loops and Proof Strategies
5. Code Dataset Curation: Deduplication, License Filtering, Quality Scoring
6. Multilingual Data: Cross-Lingual Transfer and Low-Resource Language Pipelines
7. Instruction Tuning Data: ShareGPT, OpenAssistant, and Quality Metrics
8. Preference Data: Building DPO/RLHF Datasets from Human and AI Feedback
9. Data Mixing: Optimal Proportions of Code, Math, Web, Books
10. Evaluation Datasets: Building Benchmarks That Actually Measure Capability
11. Data Contamination: Detecting and Preventing Benchmark Leakage
12. The Data Scaling Law: How Much Data Is Enough?

### Frontier Research 2025-2026 (2 existing + 10 new = 12 total)
New posts (seriesOrder 3-12):
3. Policy of Thoughts (PoT): Test-Time Policy Evolution
4. Test-Time Compute Scaling: When Small Models Beat Large Ones
5. Self-Improving Systems: Models That Generate Their Own Training Data
6. Embodied AI Foundations: Sora, V-JEPA, and Physical World Models
7. Reward Model Engineering: ORM vs PRM vs Verifiers
8. Constitutional AI and RLHF Alternatives: DPO, KTO, ORPO
9. Long-Context Research: 10M+ Token Architectures
10. Multimodal Fusion: Early vs Late Fusion, Cross-Attention, Interleaved
11. Efficient Fine-Tuning: LoRA, DoRA, QLoRA, GaLore, LISA
12. The Research Frontier in 2026: Open Problems and Promising Directions

## Total: ~100 new posts + 102 existing = ~200 posts
