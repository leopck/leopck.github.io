import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// NOTE: rehype-pretty-code has been REMOVED.
// It conflicts with Astro's built-in Shiki integration.
// Astro already handles code highlighting via shikiConfig below.

export default defineConfig({
  site: 'https://fridayswithfaraday.com',
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
      // Shiki is configured globally below in markdown.shikiConfig
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
      // Map 'cuda' to 'cpp' so code blocks with ```cuda get highlighted
      langAlias: {
        cuda: 'cpp',
      },
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Fix: Use modern Sass compiler API (eliminates legacy-js-api deprecation warnings)
          api: 'modern-compiler',
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
