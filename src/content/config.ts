import { defineCollection, reference, z } from 'astro:content';

const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    github: z.string().url().optional(),
  }),
});

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('authors'), 
    category: z.string(),
    tags: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('advanced'),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    heroImage: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    prerequisites: z.array(z.string()).optional(),
    codeRepo: z.string().url().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
  authors: authorsCollection,
};