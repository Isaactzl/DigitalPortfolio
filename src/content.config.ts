import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

export const benchObjects = ['forms', 'hoops', 'vr', 'cats', 'lock', 'arcade'] as const;

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
      /** A full URL, or a path on this site such as "play/". */
      live: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string(), caption: z.string() })).optional(),
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

const topic = z.enum(['linux', 'network', 'web', 'python', 'data', 'mainframe']);
const baseQuestion = z
  .object({
    id: z.string(),
    topic,
    kind: z.enum(['choice', 'typed']),
    prompt: z.string(),
    code: z.string().optional(),
    choices: z.array(z.string()).min(2).optional(),
    answer: z.union([z.number().int().min(0), z.array(z.string()).min(1)]),
    explain: z.string().min(10),
  })
  // A choice question needs choices and an index into them; a typed one needs accepted answers.
  .refine((q) =>
    q.kind === 'choice'
      ? typeof q.answer === 'number' && !!q.choices && q.answer < q.choices.length
      : Array.isArray(q.answer),
  );

const questions = defineCollection({
  loader: file('./src/content/questions.json'),
  schema: z.intersection(baseQuestion, z.object({ followUp: baseQuestion.optional() })),
});

export const collections = { projects, other, questions };
