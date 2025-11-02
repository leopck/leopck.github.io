// Search index for client-side search
const searchIndex = [
  {
    "title": "Minimal Bare Metal Bootloader",
    "description": "**ARM Cortex-M4** • **Bootloader** • **Assembly**",
    "category": "experiments",
    "tags": [],
    "slug": "bootloader",
    "url": "experiments/bootloader.html",
    "readingTime": "6 min read",
    "difficulty": "Beginner"
  },
  {
    "title": "Getting ESP32 to 12µA Sleep Current",
    "description": "**Tags:** ESP32 • Low Power • Deep Sleep",
    "category": "experiments",
    "tags": [],
    "slug": "esp32-low-power",
    "url": "experiments/esp32-low-power.html",
    "readingTime": "4 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "High-Speed ADC with DMA",
    "description": "**STM32F4** **DMA** **ADC**",
    "category": "experiments",
    "tags": [],
    "slug": "stm32-dma",
    "url": "experiments/stm32-dma.html",
    "readingTime": "5 min read",
    "difficulty": "Beginner"
  },
  {
    "title": "ESP32 High-Speed ADC Performance: DMA and Interrupt Analysis",
    "description": "High-speed analog-to-digital conversion on microcontrollers often becomes CPU-bound long before hitting the advertised sampling rates. The ESP32 integrates two successive approximation register (SAR) ",
    "category": "esp32",
    "tags": [],
    "slug": "esp32-adc-performance",
    "url": "esp32/esp32-adc-performance.html",
    "readingTime": "14 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "ESP32 Power Management Trade-offs: Register-Level Investigation",
    "description": "Power management on ESP32 involves complex trade-offs between voltage regulation efficiency, clock configuration optimization, power domain control, and application performance requirements. While Esp",
    "category": "esp32",
    "tags": [],
    "slug": "esp32-power-management",
    "url": "esp32/esp32-power-management.html",
    "readingTime": "21 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Achieving Sub‑1µA Sleep Currents on ESP32: A Register‑Level, Memory‑ and Timing‑Aware Methodology",
    "description": "Ultra‑low power systems demand a disciplined understanding of silicon behavior, memory placement, and clock/power domains. On the ESP32, sleep current is shaped by Dynamic Frequency Scaling (DFS), aut",
    "category": "esp32",
    "tags": [],
    "slug": "esp32-ultra-low-power",
    "url": "esp32/esp32-ultra-low-power.html",
    "readingTime": "15 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "ESP32 Real-Time WiFi Performance: MAC Layer Analysis",
    "description": "Achieving reliable real-time WiFi performance on ESP32 presents unique challenges due to the complex interactions between the IEEE 802.11 MAC layer, firmware drivers, and application timing constraint",
    "category": "esp32",
    "tags": [],
    "slug": "esp32-wifi-performance",
    "url": "esp32/esp32-wifi-performance.html",
    "readingTime": "18 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Gaudi2 Memory Subsystem Analysis and Optimization: Deep Technical Guide",
    "description": "In AI accelerator design, the memory subsystem determines whether theoretical compute performance translates into real-world performance. Gaudi2's memory architecture represents a radical departure fr",
    "category": "gaudi",
    "tags": [],
    "slug": "gaudi-memory-subsystem",
    "url": "gaudi/gaudi-memory-subsystem.html",
    "readingTime": "14 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Mixed-Precision Arithmetic Performance on Gaudi2: FP16/BF16 Implementation Analysis",
    "description": "Mixed-precision arithmetic represents one of the most significant advances in deep learning acceleration, reducing computational requirements and memory bandwidth while maintaining model accuracy. Gau",
    "category": "gaudi",
    "tags": [],
    "slug": "gaudi-mixed-precision",
    "url": "gaudi/gaudi-mixed-precision.html",
    "readingTime": "15 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Gaudi2 vs NVIDIA H100: A Deep Technical Performance Analysis",
    "description": "When Intel released the Gaudi2 accelerator, the market's immediate question was simple: how does it stack up against NVIDIA's H100? After extensive testing and analysis, the answer is nuanced but defi",
    "category": "gaudi",
    "tags": [],
    "slug": "gaudi-vs-h100",
    "url": "gaudi/gaudi-vs-h100.html",
    "readingTime": "10 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Gaudi2 Architecture Deep Dive for AI Workloads",
    "description": "Intel’s Gaudi2 is a second-generation AI training accelerator built around a deliberate separation of concerns: a configurable Matrix Multiplication Engine (MME) optimized for GEMMs and convolutions, ",
    "category": "gaudi",
    "tags": [],
    "slug": "gaudi2-architecture",
    "url": "gaudi/gaudi2-architecture.html",
    "readingTime": "22 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "DirectX Video API Performance: Driver Internals Analysis",
    "description": "Modern video decode pipelines push complex coordination requirements across user-mode APIs, driver layers, and GPU command submission paths. DirectX Video Acceleration 2.0 (DXVA2) formalized a clear s",
    "category": "graphics",
    "tags": [],
    "slug": "dxva-performance",
    "url": "graphics/dxva-performance.html",
    "readingTime": "25 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "GPU Acceleration Pipeline Analysis with Level Zero",
    "description": "Intel's Level Zero API represents the lowest-level interface between applications and Intel GPU hardware, providing direct access to compute and acceleration capabilities. This report provides an in-d",
    "category": "graphics",
    "tags": [],
    "slug": "level-zero-analysis",
    "url": "graphics/level-zero-analysis.html",
    "readingTime": "25 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Multi-threading Performance with VAAPI",
    "description": "Video processing workloads represent one of the most computationally demanding scenarios in modern graphics systems, requiring sophisticated multi-threading strategies to achieve optimal performance. ",
    "category": "graphics",
    "tags": [],
    "slug": "vaapi-multithreading",
    "url": "graphics/vaapi-multithreading.html",
    "readingTime": "30 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Cache Hierarchy Optimization in Attention Mechanisms",
    "description": "This deep technical analysis examines cache hierarchy optimization in attention mechanisms for transformer models, focusing on CPU cache behavior, memory access patterns, and cache miss analysis. Thro",
    "category": "llm",
    "tags": [],
    "slug": "llm-cache-hierarchy",
    "url": "llm/llm-cache-hierarchy.html",
    "readingTime": "19 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "CPU vs GPU Inference: A System Call Analysis",
    "description": "This deep technical analysis examines system-level behavior during CPU vs GPU inference for large language models, focusing on process scheduling, system calls, and hardware interrupt patterns. Throug",
    "category": "llm",
    "tags": [],
    "slug": "llm-cpu-gpu-system-calls",
    "url": "llm/llm-cpu-gpu-system-calls.html",
    "readingTime": "13 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "Tracing GPU Memory Bandwidth in Transformer Models",
    "description": "Transformer inference at scale is dominated by memory traffic, not floating-point arithmetic. Across a broad set of modern models and batch sizes, decode-phase attention kernels exhibit arithmetic int",
    "category": "llm",
    "tags": [],
    "slug": "llm-gpu-memory-bandwidth",
    "url": "llm/llm-gpu-memory-bandwidth.html",
    "readingTime": "22 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Hardware-Accelerated Matrix Multiplication Deep Dive",
    "description": "This deep technical analysis examines hardware-accelerated matrix multiplication in CUDA kernels, providing a comprehensive reverse engineering study of CUDA kernels, PTX assembly analysis, and perfor",
    "category": "llm",
    "tags": [],
    "slug": "llm-matrix-multiplication",
    "url": "llm/llm-matrix-multiplication.html",
    "readingTime": "29 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "Memory Bandwidth Bottlenecks in Large Language Models",
    "description": "This deep technical analysis examines memory bandwidth bottlenecks in large language model inference, using strace, perf, and advanced memory profiling techniques to identify and resolve performance l",
    "category": "llm",
    "tags": [],
    "slug": "llm-memory-bottlenecks",
    "url": "llm/llm-memory-bottlenecks.html",
    "readingTime": "18 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "Batch Processing Performance Analysis in vLLM",
    "description": "Batch processing in vLLM represents the architectural foundation that enables high-throughput language model inference through dynamic batching, intelligent scheduling, and continuous memory managemen",
    "category": "vllm",
    "tags": [],
    "slug": "vllm-batch-processing",
    "url": "vllm/vllm-batch-processing.html",
    "readingTime": "19 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "vLLM Internals: Tracing vLLM's KV Cache Management",
    "description": "The key-value (KV) cache is the memory substrate that sustains autoregressive decoding in large language models. As tokens are generated, each layer’s attention mechanism reads previously computed key",
    "category": "vllm",
    "tags": [],
    "slug": "vllm-kv-cache",
    "url": "vllm/vllm-kv-cache.html",
    "readingTime": "17 min read",
    "difficulty": "Advanced"
  },
  {
    "title": "Memory Pool Optimization in vLLM",
    "description": "Memory management in vLLM represents the fundamental infrastructure that enables high-throughput language model inference. Unlike traditional inference engines that rely on static memory allocation, v",
    "category": "vllm",
    "tags": [],
    "slug": "vllm-memory-pool",
    "url": "vllm/vllm-memory-pool.html",
    "readingTime": "19 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "Performance Profiling of vLLM Token Generation Pipeline",
    "description": "The token generation pipeline in vLLM is the critical path where autoregressive decoding transforms from initial prompt processing into iterative token-by-token generation. While modern GPUs excel at ",
    "category": "vllm",
    "tags": [],
    "slug": "vllm-token-generation",
    "url": "vllm/vllm-token-generation.html",
    "readingTime": "14 min read",
    "difficulty": "Intermediate"
  },
  {
    "title": "\"ESP32 Advanced Power Management: Ultra-Low Power Techniques\"",
    "description": "\"Deep dive into ESP32 power management techniques including dynamic voltage scaling, power domain control, and assembly optimization for maximum battery life.\"",
    "category": "\"esp32\"",
    "tags": "[\"power-management\", \"ultra-low-power\", \"ESP32\", \"battery\", \"optimization\"]",
    "slug": "esp32-advanced-power-management",
    "url": "\"esp32\"/esp32-advanced-power-management.html",
    "readingTime": "17 min read",
    "difficulty": "\"Advanced\""
  }
];

// Search function
function searchPosts(query) {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  return searchIndex.filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.description.toLowerCase().includes(searchTerm) ||
    post.category.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.difficulty.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
}

// Highlight search results
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text;
  // Simple replacement without complex regex escaping
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, '<mark>$&</mark>');
}