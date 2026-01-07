import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { rehypeCustomComponents } from './src/plugins/rehype-custom-components.mjs';

/** @type {import('rehype-pretty-code').Options} */
const prettyCodeOptions = {
  theme: {
    dark: 'one-dark-pro',
    light: 'github-light',
  },
  keepBackground: true,
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className = ['highlighted'];
  },
  onVisitHighlightedChars(node) {
    node.properties.className = ['word'];
  },
};

export default defineConfig({
  site: 'https://fridayswithfaraday.com',
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeKatex,
        [rehypePrettyCode, prettyCodeOptions],
        rehypeCustomComponents,
      ],
      shikiConfig: {
        theme: 'one-dark-pro',
        wrap: true,
      },
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
      [rehypePrettyCode, prettyCodeOptions],
    ],
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "src/styles/variables" as *;`,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  },
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  compressHTML: true,
  scopedStyleStrategy: 'class',
});
