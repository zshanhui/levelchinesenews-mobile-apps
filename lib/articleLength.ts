/** Feed length buckets for `GET /articles?min_words=&max_words=`. */
export type ArticleLengthBucket = 'short' | 'medium' | 'long';

export const ARTICLE_LENGTH_BUCKETS: ArticleLengthBucket[] = [
  'short',
  'medium',
  'long',
];

export function articleLengthBounds(bucket: ArticleLengthBucket): {
  minWords: number;
  maxWords?: number;
} {
  switch (bucket) {
    case 'short':
      return { minWords: 150, maxWords: 500 };
    case 'medium':
      return { minWords: 501, maxWords: 1000 };
    case 'long':
      return { minWords: 1000 };
  }
}
