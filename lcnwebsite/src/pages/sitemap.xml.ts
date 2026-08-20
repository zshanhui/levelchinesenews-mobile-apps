import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function postSlug(id: string) {
  return id.replace(/\.(md|mdx)$/i, '');
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://levelchinese.app')).origin;
  const posts = (await getCollection('blog'))
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const urls: { path: string; lastmod?: Date }[] = [
    { path: '/' },
    { path: '/news' },
    { path: '/about' },
    { path: '/contact' },
    { path: '/privacy-policy' },
    { path: '/example-sentences' },
    ...posts.map((post) => ({
      path: `/news/${postSlug(post.id)}`,
      lastmod: post.data.lastUpdatedAt ?? post.data.pubDate,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    const loc = xmlEscape(new URL(url.path, origin).href);
    const lastmod = url.lastmod ? url.lastmod.toISOString().slice(0, 10) : '';
    return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
