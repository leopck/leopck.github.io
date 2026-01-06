import { defineCollection, reference, z } from 'astro:content';

// 1. Define the Authors collection to store guest profiles [cite: 1533, 1534]
const authorsCollection = defineCollection({
  type: 'data', // Using 'data' type for JSON/YAML files [cite: 1505]
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
  }),
});

// 2. Updated Post schema with multi-author references [cite: 449, 450]
const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    
    // Change author from string to a reference to the authors collection [cite: 1510]
    author: reference('authors'), 
    
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
    codeRepo: z.string().url().optional(), // Used for automatic Colab link generation
    benchmarkData: z.string().optional(),
  }),
});

// 3. Export both collections [cite: 451]
export const collections = {
  posts: postsCollection,
  authors: authorsCollection,
};