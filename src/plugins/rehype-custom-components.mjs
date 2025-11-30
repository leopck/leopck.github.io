/**
 * Custom Rehype Plugin for Fridays with Faraday
 * 
 * This plugin transforms custom markdown directives into React/Astro components.
 * 
 * Supported custom blocks:
 * - :::callout{type="warning|info|tip|danger"}
 * - :::perf-chart{data="..." title="..."}
 * - :::code-compare{before="..." after="..."}
 * - :::register-diagram{name="..." bits="..."}
 * - :::flame-graph{data="..."}
 * - :::memory-layout{...}
 * - :::timeline{...}
 * - :::benchmark{...}
 */

import { visit } from 'unist-util-visit';

// Custom directive patterns
const DIRECTIVE_PATTERNS = {
  callout: /^:::callout\{type="(\w+)"\}\s*\n([\s\S]*?)\n:::/gm,
  perfChart: /^:::perf-chart\{([^}]+)\}/gm,
  codeCompare: /^:::code-compare/gm,
  registerDiagram: /^:::register-diagram\{([^}]+)\}/gm,
  flameGraph: /^:::flame-graph\{([^}]+)\}/gm,
  memoryLayout: /^:::memory-layout\{([^}]+)\}/gm,
  timeline: /^:::timeline/gm,
  benchmark: /^:::benchmark\{([^}]+)\}/gm,
  kernelTrace: /^:::kernel-trace/gm,
  perfCounter: /^:::perf-counter\{([^}]+)\}/gm,
};

/**
 * Parse directive attributes from string
 * @param {string} attrString - The attribute string like 'type="warning" title="Note"'
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrString) {
  const attrs = {};
  const regex = /(\w+)="([^"]+)"/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Transform custom directives in the AST
 */
export function rehypeCustomComponents() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // Process code blocks with custom language identifiers
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        const codeNode = node.children[0];
        const className = codeNode.properties?.className?.[0] || '';
        
        // Handle special code block types
        if (className.includes('language-perf-output')) {
          node.properties = {
            ...node.properties,
            'data-component': 'PerfOutput',
            className: ['perf-output-block', ...(node.properties.className || [])],
          };
        }
        
        if (className.includes('language-asm')) {
          node.properties = {
            ...node.properties,
            'data-component': 'AssemblyCode',
            className: ['asm-block', ...(node.properties.className || [])],
          };
        }

        if (className.includes('language-dtrace')) {
          node.properties = {
            ...node.properties,
            'data-component': 'DTraceScript',
            className: ['dtrace-block', ...(node.properties.className || [])],
          };
        }

        if (className.includes('language-bpftrace')) {
          node.properties = {
            ...node.properties,
            'data-component': 'BPFTrace',
            className: ['bpftrace-block', ...(node.properties.className || [])],
          };
        }

        if (className.includes('language-flamegraph')) {
          node.properties = {
            ...node.properties,
            'data-component': 'FlameGraph',
            className: ['flamegraph-block', ...(node.properties.className || [])],
          };
        }
      }

      // Process div elements with custom data attributes
      if (node.tagName === 'div' && node.properties?.['data-directive']) {
        const directive = node.properties['data-directive'];
        
        switch (directive) {
          case 'callout':
            node.properties.className = [
              'callout',
              `callout-${node.properties['data-type'] || 'info'}`,
              ...(node.properties.className || []),
            ];
            break;
          
          case 'perf-chart':
            node.properties.className = [
              'perf-chart-container',
              ...(node.properties.className || []),
            ];
            break;

          case 'register-diagram':
            node.properties.className = [
              'register-diagram',
              ...(node.properties.className || []),
            ];
            break;

          case 'memory-layout':
            node.properties.className = [
              'memory-layout-diagram',
              ...(node.properties.className || []),
            ];
            break;

          case 'benchmark':
            node.properties.className = [
              'benchmark-results',
              ...(node.properties.className || []),
            ];
            break;
        }
      }
    });

    // Process text nodes for inline directives
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value) return;

      // Transform inline performance annotations
      const perfAnnotationRegex = /\[\[perf:(\w+):([^\]]+)\]\]/g;
      if (perfAnnotationRegex.test(node.value)) {
        // Mark for client-side processing
        if (parent && parent.properties) {
          parent.properties['data-has-perf-annotations'] = true;
        }
      }
    });
  };
}

export default rehypeCustomComponents;
