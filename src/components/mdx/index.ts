// MDX Components Index
// Import these in your MDX files or in the Astro config

export { default as Callout } from './Callout.astro';
export { default as RegisterDiagram } from './RegisterDiagram.astro';
export { default as MemoryLayout } from './MemoryLayout.astro';
export { default as PerfChart } from './PerfChart.astro';
export { default as CodeCompare } from './CodeCompare.astro';
export { default as Benchmark } from './Benchmark.astro';

// Re-export types if needed
export type CalloutType = 'info' | 'warning' | 'danger' | 'tip' | 'perf';
