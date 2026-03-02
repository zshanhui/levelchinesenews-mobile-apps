/** Article list item from GET /api/v1/articles */
export interface ArticleListItem {
  id: string;
  title: string;
  source: string | null;
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
  f: string;  // full_text
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
