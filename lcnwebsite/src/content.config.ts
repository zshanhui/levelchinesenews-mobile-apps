import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Allowed `postType` values in blog frontmatter. */
const blogPostTypeEnum = z.enum(['news', 'htlarticle', 'newslesson']);

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    draft: z.boolean().optional().default(false),
    lastUpdatedAt: z.date().optional(),
    postType: blogPostTypeEnum.default('news'),
  }),
});

const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.string(),
  }),
});

export const collections = {
  blog,
  about,
  legal,
};
