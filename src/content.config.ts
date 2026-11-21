import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

export const benchObjects = ['forms', 'hoops', 'vr', 'cats', 'lock'] as const;

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      no: z.string().regex(/^\d{3}$/),
      title: z.string(),
      status: z.enum(['Deployed', 'In use', 'Shipped']),
      kind: z.string(),
      stack: z.array(z.string()).min(1),
      summary: z.string().max(200),
      cover: image(),
      coverAlt: z.string(),
      bench: z.enum(benchObjects),
      video: z.object({ src: z.string(), kind: z.enum(['file', 'youtube']) }).optional(),
      live: z.url().optional(),
    }),
});

const other = defineCollection({
  loader: file('./src/content/other.json'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      line: z.string(),
      stack: z.array(z.string()),
      image: image(),
      youtube: z.string().optional(),
    }),
});

export const collections = { projects, other };
