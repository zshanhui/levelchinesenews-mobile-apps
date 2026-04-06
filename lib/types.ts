import type { NativeLanguage } from './nativeLanguage';

/** Article list item from GET /api/v1/articles */
export interface ArticleListItem {
  id: string;
  title: string;
  source: string | null;
  /** Word count from API (e.g. Chinese word segments); null when unknown */
  word_count: number | null;
  source_url: string | null;
  main_image: string | null;
  published_date: string | null;
  tags: string[];
  title_translated_en: string | null;
  summary_generated_en: string | null;
  created_at: string;
  updated_at: string;
}

/** Scrape response: article data plus existing flag (POST /api/v1/scrape) */
export interface ScrapeResponse extends ArticleListItem {
  /** True if article was already in DB, false if newly created */
  existing: boolean;
}

/** Paginated list response */
export interface ArticleListResponse {
  items: ArticleListItem[];
  total: number;
  page: number;
  page_size: number;
}

/** Word segment from parsed_content (API uses aliases t, p) */
export interface WordSegment {
  t: string;  // text
  p?: string | null;  // pinyin
}

/** Sentence from parsed_content (API uses aliases f, w) */
export interface Sentence {
  /** Full sentence text */
  f: string;
  w: WordSegment[];  // words
}

/** Paragraph from parsed_content (API uses alias s) */
export interface ParsedParagraph {
  s: Sentence[];  // sentences
}

/** Article detail from GET /api/v1/articles/{id} (includes parsed_content) */
export interface ArticleDetail extends ArticleListItem {
  parsed_content?: ParsedParagraph[] | null;
}

/** One cached sentence translation from GET /api/v1/translations */
export interface StoredTranslationEntry {
  translated_text: string;
  source_text_hash: string;
  provider: string;
  created_at: string;
}

/** GET /api/v1/translations?article_id= — cached sentence translations per language */
export interface ArticleTranslationsResponse {
  article_id: string;
  /** Map sentence key `paragraph_index:sentence_index` → target_lang → entry */
  article_sentence: Record<string, Record<string, StoredTranslationEntry>>;
}

/** POST /api/v1/translations body discriminator; extend when adding request kinds. */
export enum TranslationKind {
  ArticleSentence = 'article_sentence',
}

/** POST /api/v1/translations */
export interface TranslationResponse {
  kind: TranslationKind;
  article_id: string;
  /** Set for `article_sentence`; null when another kind omits indices. */
  paragraph_index: number | null;
  /** Set for `article_sentence`; null when another kind omits indices. */
  sentence_index: number | null;
  target_lang: NativeLanguage;
  translated_text: string;
  cached: boolean;
  provider?: string | null;
}
