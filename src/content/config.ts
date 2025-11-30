import { defineCollection, z } from 'astro:content';

// Post schema with full typing
const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Fridays with Faraday'),
    category: z.enum([
      'microcontrollers',
      'vllm',
      'llm-inference',
      'transformers',
      'hardware-optimization',
      'profiling',
      'kernel-development',
      'memory-systems',
      'distributed-systems',
      'gpu-programming'
    ]),
    tags: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('advanced'),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    heroImage: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    prerequisites: z.array(z.string()).optional(),
    relatedPosts: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    codeRepo: z.string().url().optional(),
    benchmarkData: z.string().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};
