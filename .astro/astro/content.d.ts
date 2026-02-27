declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"posts": {
"alibi-rotary-embeddings-performance-comparison-2020.mdx": {
	id: "alibi-rotary-embeddings-performance-comparison-2020.mdx";
  slug: "alibi-rotary-embeddings-performance-comparison-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"attention-performance-analysis-2019.mdx": {
	id: "attention-performance-analysis-2019.mdx";
  slug: "attention-performance-analysis-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"attention-variants-mha-mqa-gqa.mdx": {
	id: "attention-variants-mha-mqa-gqa.mdx";
  slug: "attention-variants-mha-mqa-gqa";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"batch-processing-llm-optimization-2019.mdx": {
	id: "batch-processing-llm-optimization-2019.mdx";
  slug: "batch-processing-llm-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"bert-gpt-architecture-performance-trade-offs-2019.mdx": {
	id: "bert-gpt-architecture-performance-trade-offs-2019.mdx";
  slug: "bert-gpt-architecture-performance-trade-offs-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"continuous-batching-implementation.mdx": {
	id: "continuous-batching-implementation.mdx";
  slug: "continuous-batching-implementation";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cortex-m4-dsp-audio.mdx": {
	id: "cortex-m4-dsp-audio.mdx";
  slug: "cortex-m4-dsp-audio";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cortex-m4-performance-optimization-2020.mdx": {
	id: "cortex-m4-performance-optimization-2020.mdx";
  slug: "cortex-m4-performance-optimization-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cpu-cache-hierarchy-2019.mdx": {
	id: "cpu-cache-hierarchy-2019.mdx";
  slug: "cpu-cache-hierarchy-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-graphs-inference-startup-latency-2020.mdx": {
	id: "cuda-graphs-inference-startup-latency-2020.mdx";
  slug: "cuda-graphs-inference-startup-latency-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-graphs-inference.mdx": {
	id: "cuda-graphs-inference.mdx";
  slug: "cuda-graphs-inference";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-kernel-fusion-memory-traffic-2020.mdx": {
	id: "cuda-kernel-fusion-memory-traffic-2020.mdx";
  slug: "cuda-kernel-fusion-memory-traffic-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-kernel-optimization-techniques-2019.mdx": {
	id: "cuda-kernel-optimization-techniques-2019.mdx";
  slug: "cuda-kernel-optimization-techniques-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-kernel-optimization.mdx": {
	id: "cuda-kernel-optimization.mdx";
  slug: "cuda-kernel-optimization";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-streams-overlap-pcie-2020.mdx": {
	id: "cuda-streams-overlap-pcie-2020.mdx";
  slug: "cuda-streams-overlap-pcie-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-unified-memory-performance-ai-workloads-2019.mdx": {
	id: "cuda-unified-memory-performance-ai-workloads-2019.mdx";
  slug: "cuda-unified-memory-performance-ai-workloads-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-warp-level-optimization-2019.mdx": {
	id: "cuda-warp-level-optimization-2019.mdx";
  slug: "cuda-warp-level-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"cuda-warp-occupancy-latency-hiding-2020.mdx": {
	id: "cuda-warp-occupancy-latency-hiding-2020.mdx";
  slug: "cuda-warp-occupancy-latency-hiding-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"decoding-performance-beam-vs-sampling-2020.mdx": {
	id: "decoding-performance-beam-vs-sampling-2020.mdx";
  slug: "decoding-performance-beam-vs-sampling-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"deepspeed-zero-memory-optimization-performance-2019.mdx": {
	id: "deepspeed-zero-memory-optimization-performance-2019.mdx";
  slug: "deepspeed-zero-memory-optimization-performance-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"ebpf-llm-profiling.mdx": {
	id: "ebpf-llm-profiling.mdx";
  slug: "ebpf-llm-profiling";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-adc-performance-optimization-2019.mdx": {
	id: "esp32-adc-performance-optimization-2019.mdx";
  slug: "esp32-adc-performance-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-cpu-frequency-scaling-2019.mdx": {
	id: "esp32-cpu-frequency-scaling-2019.mdx";
  slug: "esp32-cpu-frequency-scaling-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-i2c-optimization-latency-throughput-2020.mdx": {
	id: "esp32-i2c-optimization-latency-throughput-2020.mdx";
  slug: "esp32-i2c-optimization-latency-throughput-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-power-management-basics-2019.mdx": {
	id: "esp32-power-management-basics-2019.mdx";
  slug: "esp32-power-management-basics-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-rtc-memory-optimization-2019.mdx": {
	id: "esp32-rtc-memory-optimization-2019.mdx";
  slug: "esp32-rtc-memory-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-spi-dma-throughput-2020.mdx": {
	id: "esp32-spi-dma-throughput-2020.mdx";
  slug: "esp32-spi-dma-throughput-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-sub-10ua-deep-sleep.mdx": {
	id: "esp32-sub-10ua-deep-sleep.mdx";
  slug: "esp32-sub-10ua-deep-sleep";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-ulp-coprocessor-optimization-2020.mdx": {
	id: "esp32-ulp-coprocessor-optimization-2020.mdx";
  slug: "esp32-ulp-coprocessor-optimization-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"esp32-wifi-power-analysis-2019.mdx": {
	id: "esp32-wifi-power-analysis-2019.mdx";
  slug: "esp32-wifi-power-analysis-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"feature-showcase.mdx": {
	id: "feature-showcase.mdx";
  slug: "feature-showcase";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"flashattention-memory-hierarchy.mdx": {
	id: "flashattention-memory-hierarchy.mdx";
  slug: "flashattention-memory-hierarchy";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gaudi2-memory-optimization.mdx": {
	id: "gaudi2-memory-optimization.mdx";
  slug: "gaudi2-memory-optimization";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpipe-pipedream-pipeline-parallelism-performance-analysis-2019.mdx": {
	id: "gpipe-pipedream-pipeline-parallelism-performance-analysis-2019.mdx";
  slug: "gpipe-pipedream-pipeline-parallelism-performance-analysis-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpu-memory-bandwidth-optimization-2020.mdx": {
	id: "gpu-memory-bandwidth-optimization-2020.mdx";
  slug: "gpu-memory-bandwidth-optimization-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpu-memory-hierarchy-2019.mdx": {
	id: "gpu-memory-hierarchy-2019.mdx";
  slug: "gpu-memory-hierarchy-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpu-memory-profiling.mdx": {
	id: "gpu-memory-profiling.mdx";
  slug: "gpu-memory-profiling";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpu-shared-memory-optimization-2019.mdx": {
	id: "gpu-shared-memory-optimization-2019.mdx";
  slug: "gpu-shared-memory-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gpu-tensor-core-optimization-2019.mdx": {
	id: "gpu-tensor-core-optimization-2019.mdx";
  slug: "gpu-tensor-core-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"gradient-compression-distributed-training-2019.mdx": {
	id: "gradient-compression-distributed-training-2019.mdx";
  slug: "gradient-compression-distributed-training-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"grouped-query-attention.mdx": {
	id: "grouped-query-attention.mdx";
  slug: "grouped-query-attention";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"habana-gaudi-nvidia-v100-ai-training-performance-2020.mdx": {
	id: "habana-gaudi-nvidia-v100-ai-training-performance-2020.mdx";
  slug: "habana-gaudi-nvidia-v100-ai-training-performance-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"i2c-bus-optimization.mdx": {
	id: "i2c-bus-optimization.mdx";
  slug: "i2c-bus-optimization";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"kv-cache-allocator-memory-pool-2020.mdx": {
	id: "kv-cache-allocator-memory-pool-2020.mdx";
  slug: "kv-cache-allocator-memory-pool-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"kv-cache-optimization-llm-2019.mdx": {
	id: "kv-cache-optimization-llm-2019.mdx";
  slug: "kv-cache-optimization-llm-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"kv-cache-quantization.mdx": {
	id: "kv-cache-quantization.mdx";
  slug: "kv-cache-quantization";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"llm-inference-basics-2019.mdx": {
	id: "llm-inference-basics-2019.mdx";
  slug: "llm-inference-basics-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"llm-prefill-optimization-2019.mdx": {
	id: "llm-prefill-optimization-2019.mdx";
  slug: "llm-prefill-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"llm-request-scheduling-batching-2020.mdx": {
	id: "llm-request-scheduling-batching-2020.mdx";
  slug: "llm-request-scheduling-batching-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"llm-speculative-decoding-2020.mdx": {
	id: "llm-speculative-decoding-2020.mdx";
  slug: "llm-speculative-decoding-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"memory-bandwidth-analysis-2019.mdx": {
	id: "memory-bandwidth-analysis-2019.mdx";
  slug: "memory-bandwidth-analysis-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"memory-efficient-adam-optimizer-implementations-2019.mdx": {
	id: "memory-efficient-adam-optimizer-implementations-2019.mdx";
  slug: "memory-efficient-adam-optimizer-implementations-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"memory-mapping-large-model-loading-2020.mdx": {
	id: "memory-mapping-large-model-loading-2020.mdx";
  slug: "memory-mapping-large-model-loading-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"mixed-precision-training-fp16-fp32-performance-analysis-2019.mdx": {
	id: "mixed-precision-training-fp16-fp32-performance-analysis-2019.mdx";
  slug: "mixed-precision-training-fp16-fp32-performance-analysis-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"mixture-of-experts-scaling-llms-conditional-computation-2020.mdx": {
	id: "mixture-of-experts-scaling-llms-conditional-computation-2020.mdx";
  slug: "mixture-of-experts-scaling-llms-conditional-computation-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"model-pruning-techniques-performance-accuracy-trade-offs-2019.mdx": {
	id: "model-pruning-techniques-performance-accuracy-trade-offs-2019.mdx";
  slug: "model-pruning-techniques-performance-accuracy-trade-offs-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"multi-gpu-data-vs-model-parallel-2020.mdx": {
	id: "multi-gpu-data-vs-model-parallel-2020.mdx";
  slug: "multi-gpu-data-vs-model-parallel-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"neural-architecture-search-performance-optimization-2019.mdx": {
	id: "neural-architecture-search-performance-optimization-2019.mdx";
  slug: "neural-architecture-search-performance-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"nvidia-nccl-performance-tuning-multi-gpu-training-2020.mdx": {
	id: "nvidia-nccl-performance-tuning-multi-gpu-training-2020.mdx";
  slug: "nvidia-nccl-performance-tuning-multi-gpu-training-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"onnx-runtime-performance-optimization-techniques-2020.mdx": {
	id: "onnx-runtime-performance-optimization-techniques-2020.mdx";
  slug: "onnx-runtime-performance-optimization-techniques-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"optimizing-gemm-neural-networks-blas-custom-kernels-2019.mdx": {
	id: "optimizing-gemm-neural-networks-blas-custom-kernels-2019.mdx";
  slug: "optimizing-gemm-neural-networks-blas-custom-kernels-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"quantization-llm-performance-2019.mdx": {
	id: "quantization-llm-performance-2019.mdx";
  slug: "quantization-llm-performance-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"request-routing-llm-inference.mdx": {
	id: "request-routing-llm-inference.mdx";
  slug: "request-routing-llm-inference";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"roofline-gpu-kernel-optimization-2020.mdx": {
	id: "roofline-gpu-kernel-optimization-2020.mdx";
  slug: "roofline-gpu-kernel-optimization-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"rope-embeddings-long-context.mdx": {
	id: "rope-embeddings-long-context.mdx";
  slug: "rope-embeddings-long-context";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"simd-optimization-basics-2019.mdx": {
	id: "simd-optimization-basics-2019.mdx";
  slug: "simd-optimization-basics-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"sparse-attention-mechanisms-efficiency-analysis-2020.mdx": {
	id: "sparse-attention-mechanisms-efficiency-analysis-2020.mdx";
  slug: "sparse-attention-mechanisms-efficiency-analysis-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"speculative-decoding.mdx": {
	id: "speculative-decoding.mdx";
  slug: "speculative-decoding";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"stm32-clock-optimization-2019.mdx": {
	id: "stm32-clock-optimization-2019.mdx";
  slug: "stm32-clock-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"stm32-dma-double-buffering-real-time-2020.mdx": {
	id: "stm32-dma-double-buffering-real-time-2020.mdx";
  slug: "stm32-dma-double-buffering-real-time-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"stm32-dma-fundamentals-2019.mdx": {
	id: "stm32-dma-fundamentals-2019.mdx";
  slug: "stm32-dma-fundamentals-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"stm32-interrupt-optimization-2019.mdx": {
	id: "stm32-interrupt-optimization-2019.mdx";
  slug: "stm32-interrupt-optimization-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"stm32-timer-capture-jitter-2020.mdx": {
	id: "stm32-timer-capture-jitter-2020.mdx";
  slug: "stm32-timer-capture-jitter-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"tensor-parallelism-allreduce.mdx": {
	id: "tensor-parallelism-allreduce.mdx";
  slug: "tensor-parallelism-allreduce";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"tensorrt-optimization-llm-inference-2019.mdx": {
	id: "tensorrt-optimization-llm-inference-2019.mdx";
  slug: "tensorrt-optimization-llm-inference-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"transformer-architecture-analysis-2020.mdx": {
	id: "transformer-architecture-analysis-2020.mdx";
  slug: "transformer-architecture-analysis-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"transformer-attention-mechanism-2019.mdx": {
	id: "transformer-attention-mechanism-2019.mdx";
  slug: "transformer-attention-mechanism-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"transformer-xl-long-range-attention-2019.mdx": {
	id: "transformer-xl-long-range-attention-2019.mdx";
  slug: "transformer-xl-long-range-attention-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"turing-volta-architecture-ai-workloads-2020.mdx": {
	id: "turing-volta-architecture-ai-workloads-2020.mdx";
  slug: "turing-volta-architecture-ai-workloads-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-pagedattention-introduction-2020.mdx": {
	id: "vllm-pagedattention-introduction-2020.mdx";
  slug: "vllm-pagedattention-introduction-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-pagedattention-memory-analysis.mdx": {
	id: "vllm-pagedattention-memory-analysis.mdx";
  slug: "vllm-pagedattention-memory-analysis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		"authors": {
"stanley-phoong": {
	id: "stanley-phoong";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
};

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}
