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
"attention-variants-mha-mqa-gqa.mdx": {
	id: "attention-variants-mha-mqa-gqa.mdx";
  slug: "attention-variants-mha-mqa-gqa";
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
"building-a-transformer-from-scratch-putting-it-all-together.mdx": {
	id: "building-a-transformer-from-scratch-putting-it-all-together.mdx";
  slug: "building-a-transformer-from-scratch-putting-it-all-together";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"compute-communication-overlap-distributed-training.mdx": {
	id: "compute-communication-overlap-distributed-training.mdx";
  slug: "compute-communication-overlap-distributed-training";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"constrained-structured-generation-fsm-grammars.mdx": {
	id: "constrained-structured-generation-fsm-grammars.mdx";
  slug: "constrained-structured-generation-fsm-grammars";
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
"cpu-edge-inference-llama-cpp-gguf.mdx": {
	id: "cpu-edge-inference-llama-cpp-gguf.mdx";
  slug: "cpu-edge-inference-llama-cpp-gguf";
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
"dataset-frontier-agent-simulation-synthetic.mdx": {
	id: "dataset-frontier-agent-simulation-synthetic.mdx";
  slug: "dataset-frontier-agent-simulation-synthetic";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"dataset-frontier-curation-dclm-fineweb.mdx": {
	id: "dataset-frontier-curation-dclm-fineweb.mdx";
  slug: "dataset-frontier-curation-dclm-fineweb";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"dataset-frontier-preference-data-dpo-rlhf.mdx": {
	id: "dataset-frontier-preference-data-dpo-rlhf.mdx";
  slug: "dataset-frontier-preference-data-dpo-rlhf";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"dataset-frontier-synthetic-data-pipelines.mdx": {
	id: "dataset-frontier-synthetic-data-pipelines.mdx";
  slug: "dataset-frontier-synthetic-data-pipelines";
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
"deepseek-v3-architecture-deep-dive.mdx": {
	id: "deepseek-v3-architecture-deep-dive.mdx";
  slug: "deepseek-v3-architecture-deep-dive";
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
"disaggregated-prefill-decode-serving.mdx": {
	id: "disaggregated-prefill-decode-serving.mdx";
  slug: "disaggregated-prefill-decode-serving";
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
"embedding-layers-llm-geometry.mdx": {
	id: "embedding-layers-llm-geometry.mdx";
  slug: "embedding-layers-llm-geometry";
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
"ffn-swiglu-gated-networks-key-value-memory.mdx": {
	id: "ffn-swiglu-gated-networks-key-value-memory.mdx";
  slug: "ffn-swiglu-gated-networks-key-value-memory";
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
"frontier-models-2025-architectural-convergence.mdx": {
	id: "frontier-models-2025-architectural-convergence.mdx";
  slug: "frontier-models-2025-architectural-convergence";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-constitutional-ai-dpo-alternatives.mdx": {
	id: "frontier-research-constitutional-ai-dpo-alternatives.mdx";
  slug: "frontier-research-constitutional-ai-dpo-alternatives";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-lightning-attention-linear-scaling.mdx": {
	id: "frontier-research-lightning-attention-linear-scaling.mdx";
  slug: "frontier-research-lightning-attention-linear-scaling";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-long-context-10m-architectures.mdx": {
	id: "frontier-research-long-context-10m-architectures.mdx";
  slug: "frontier-research-long-context-10m-architectures";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-policy-of-thoughts-test-time.mdx": {
	id: "frontier-research-policy-of-thoughts-test-time.mdx";
  slug: "frontier-research-policy-of-thoughts-test-time";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-reasoning-scaling-laws.mdx": {
	id: "frontier-research-reasoning-scaling-laws.mdx";
  slug: "frontier-research-reasoning-scaling-laws";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-reward-model-engineering.mdx": {
	id: "frontier-research-reward-model-engineering.mdx";
  slug: "frontier-research-reward-model-engineering";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"frontier-research-test-time-compute-small-beats-large.mdx": {
	id: "frontier-research-test-time-compute-small-beats-large.mdx";
  slug: "frontier-research-test-time-compute-small-beats-large";
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
"habana-gaudi-nvidia-v100-ai-training-performance-2020.mdx": {
	id: "habana-gaudi-nvidia-v100-ai-training-performance-2020.mdx";
  slug: "habana-gaudi-nvidia-v100-ai-training-performance-2020";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-cost-economics-tokens-per-dollar.mdx": {
	id: "inference-cost-economics-tokens-per-dollar.mdx";
  slug: "inference-cost-economics-tokens-per-dollar";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-time-compute-scaling-chain-of-thought.mdx": {
	id: "inference-time-compute-scaling-chain-of-thought.mdx";
  slug: "inference-time-compute-scaling-chain-of-thought";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-timeline-batched-gemm-throughput.mdx": {
	id: "inference-timeline-batched-gemm-throughput.mdx";
  slug: "inference-timeline-batched-gemm-throughput";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-timeline-speculative-decoding-v2.mdx": {
	id: "inference-timeline-speculative-decoding-v2.mdx";
  slug: "inference-timeline-speculative-decoding-v2";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-timeline-token-generation-pipeline.mdx": {
	id: "inference-timeline-token-generation-pipeline.mdx";
  slug: "inference-timeline-token-generation-pipeline";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"inference-timeline-vlm-serving-vit-paging.mdx": {
	id: "inference-timeline-vlm-serving-vit-paging.mdx";
  slug: "inference-timeline-vlm-serving-vit-paging";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"kimi-k2-trillion-parameter-moe-architecture.mdx": {
	id: "kimi-k2-trillion-parameter-moe-architecture.mdx";
  slug: "kimi-k2-trillion-parameter-moe-architecture";
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
"llm-serving-engine-comparison.mdx": {
	id: "llm-serving-engine-comparison.mdx";
  slug: "llm-serving-engine-comparison";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"lora-qlora-multi-adapter-serving.mdx": {
	id: "lora-qlora-multi-adapter-serving.mdx";
  slug: "lora-qlora-multi-adapter-serving";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"loss-function-cross-entropy-teacher-forcing.mdx": {
	id: "loss-function-cross-entropy-teacher-forcing.mdx";
  slug: "loss-function-cross-entropy-teacher-forcing";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"mamba-state-space-models-linear-attention.mdx": {
	id: "mamba-state-space-models-linear-attention.mdx";
  slug: "mamba-state-space-models-linear-attention";
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
"minimax-01-lightning-attention-long-context.mdx": {
	id: "minimax-01-lightning-attention-long-context.mdx";
  slug: "minimax-01-lightning-attention-long-context";
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
"moe-masterclass-deepseek-mla-implementation.mdx": {
	id: "moe-masterclass-deepseek-mla-implementation.mdx";
  slug: "moe-masterclass-deepseek-mla-implementation";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"moe-masterclass-expert-parallelism-communication.mdx": {
	id: "moe-masterclass-expert-parallelism-communication.mdx";
  slug: "moe-masterclass-expert-parallelism-communication";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"moe-masterclass-gated-layer-implementation.mdx": {
	id: "moe-masterclass-gated-layer-implementation.mdx";
  slug: "moe-masterclass-gated-layer-implementation";
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
"normalization-layernorm-rmsnorm-training-stability.mdx": {
	id: "normalization-layernorm-rmsnorm-training-stability.mdx";
  slug: "normalization-layernorm-rmsnorm-training-stability";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"nvidia-dynamo-kv-aware-routing-inference-os.mdx": {
	id: "nvidia-dynamo-kv-aware-routing-inference-os.mdx";
  slug: "nvidia-dynamo-kv-aware-routing-inference-os";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"nvidia-dynamo-kvbm-multi-tier-offloading.mdx": {
	id: "nvidia-dynamo-kvbm-multi-tier-offloading.mdx";
  slug: "nvidia-dynamo-kvbm-multi-tier-offloading";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"nvidia-dynamo-modelexpress-nixl-cold-start.mdx": {
	id: "nvidia-dynamo-modelexpress-nixl-cold-start.mdx";
  slug: "nvidia-dynamo-modelexpress-nixl-cold-start";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"nvidia-dynamo-planner-grove-gang-scheduling.mdx": {
	id: "nvidia-dynamo-planner-grove-gang-scheduling.mdx";
  slug: "nvidia-dynamo-planner-grove-gang-scheduling";
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
"output-head-unembedding-logit-computation.mdx": {
	id: "output-head-unembedding-logit-computation.mdx";
  slug: "output-head-unembedding-logit-computation";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"prefix-caching-radixattention-cache-hierarchies.mdx": {
	id: "prefix-caching-radixattention-cache-hierarchies.mdx";
  slug: "prefix-caching-radixattention-cache-hierarchies";
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
"residual-connections-skip-paths-gradient-flow.mdx": {
	id: "residual-connections-skip-paths-gradient-flow.mdx";
  slug: "residual-connections-skip-paths-gradient-flow";
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
"simd-optimization-basics-2019.mdx": {
	id: "simd-optimization-basics-2019.mdx";
  slug: "simd-optimization-basics-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"softmax-numerics-temperature-stability.mdx": {
	id: "softmax-numerics-temperature-stability.mdx";
  slug: "softmax-numerics-temperature-stability";
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
"tensorrt-optimization-llm-inference-2019.mdx": {
	id: "tensorrt-optimization-llm-inference-2019.mdx";
  slug: "tensorrt-optimization-llm-inference-2019";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"tokenization-bpe-from-first-principles.mdx": {
	id: "tokenization-bpe-from-first-principles.mdx";
  slug: "tokenization-bpe-from-first-principles";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"transformer-anatomy-learning-rate-schedules.mdx": {
	id: "transformer-anatomy-learning-rate-schedules.mdx";
  slug: "transformer-anatomy-learning-rate-schedules";
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
"vllm-architecture-source-code-walkthrough.mdx": {
	id: "vllm-architecture-source-code-walkthrough.mdx";
  slug: "vllm-architecture-source-code-walkthrough";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-paged-attention-kernel-implementation.mdx": {
	id: "vllm-paged-attention-kernel-implementation.mdx";
  slug: "vllm-paged-attention-kernel-implementation";
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
"vllm-scheduler-continuous-batching-internals.mdx": {
	id: "vllm-scheduler-continuous-batching-internals.mdx";
  slug: "vllm-scheduler-continuous-batching-internals";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-v1-block-manager-kv-cache-internals.mdx": {
	id: "vllm-v1-block-manager-kv-cache-internals.mdx";
  slug: "vllm-v1-block-manager-kv-cache-internals";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-v1-disaggregated-multimodal-serving.mdx": {
	id: "vllm-v1-disaggregated-multimodal-serving.mdx";
  slug: "vllm-v1-disaggregated-multimodal-serving";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vllm-v1-omniconnector-multimodal-lifecycle.mdx": {
	id: "vllm-v1-omniconnector-multimodal-lifecycle.mdx";
  slug: "vllm-v1-omniconnector-multimodal-lifecycle";
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

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
