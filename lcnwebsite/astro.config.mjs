// @ts-check
import { defineConfig } from 'astro/config';

const SITE_ORIGIN = 'https://levelchinese.app';

function isExternalHref(href) {
  if (typeof href !== 'string') return false;
  if (
    href.startsWith('#') ||
    href.startsWith('/') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  ) {
    return false;
  }
  try {
    return new URL(href, SITE_ORIGIN).origin !== SITE_ORIGIN;
  } catch {
    return false;
  }
}

function rehypeExternalLinks() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href;
        if (isExternalHref(href)) {
          node.properties = node.properties ?? {};
          node.properties.target = '_blank';
          node.properties.rel = ['noopener', 'noreferrer'];
        }
      }
      for (const child of node.children ?? []) {
        walk(child);
      }
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE_ORIGIN,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  markdown: {
    smartypants: {
      quotes: false,
    },
    rehypePlugins: [rehypeExternalLinks],
  },
});
