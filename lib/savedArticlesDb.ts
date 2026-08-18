/**
 * Saved "my articles" persistence.
 * This branch is web-only: SQLite is unused and every store export is a no-op.
 */

import type { ArticleDetail, ArticleListItem, ParsedParagraph } from './types';

export interface SavedArticleWithMeta {
  item: ArticleListItem;
  read: boolean;
  /** 1-based bookmarked sentence index / total sentences, when stored with bookmark */
  bookmarkSentencePosition?: { n: number; t: number };
}

/** 1-based sentence number and total for bookmark card UI; null if parsed content missing or indices invalid */
export function computeSentenceBookmarkDisplay(
  parsed: ParsedParagraph[] | null | undefined,
  p: number,
  s: number,
): { n: number; t: number } | null {
  if (!parsed?.length) return null;
  let total = 0;
  for (const para of parsed) {
    total += para.s?.length ?? 0;
  }
  if (total < 1) return null;
  let n = 0;
  for (let pi = 0; pi < parsed.length; pi++) {
    const sentences = parsed[pi].s ?? [];
    for (let si = 0; si < sentences.length; si++) {
      n += 1;
      if (pi === p && si === s) {
        return { n, t: total };
      }
    }
  }
  return null;
}

export async function listSavedArticles(): Promise<SavedArticleWithMeta[]> {
  return [];
}

export async function upsertSavedArticle(_item: ArticleListItem): Promise<void> {}

export async function upsertSavedArticleWithSentenceBookmark(
  _item: ArticleListItem,
  _indexes: [number, number],
  _display: { n: number; t: number } | null = null,
): Promise<void> {}

export async function removeSavedArticle(_articleId: string): Promise<void> {}

export function articleDetailToListItem(article: ArticleDetail): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    source: article.source,
    word_count: article.word_count,
    source_url: article.source_url,
    main_image: article.main_image,
    published_date: article.published_date,
    tags: article.tags ?? [],
    title_translated_en: article.title_translated_en,
    summary_generated_en: article.summary_generated_en,
    created_at: article.created_at,
    updated_at: article.updated_at,
  };
}

export async function upsertArticleMarkedRead(_item: ArticleListItem): Promise<void> {}

export async function setRead(_articleId: string, _read: boolean): Promise<void> {}

export async function getSentenceBookmark(
  _articleId: string,
): Promise<[number, number] | null> {
  return null;
}

export async function clearSentenceBookmark(_articleId: string): Promise<void> {}

export async function bookmarkArticleSentence(
  _articleId: string,
  _indexes: [number, number],
): Promise<void> {}

export async function isSavedArticle(_articleId: string): Promise<boolean> {
  return false;
}

export async function getReadState(_articleId: string): Promise<boolean> {
  return false;
}

export async function getReadStatesForArticleIds(
  _ids: string[],
): Promise<Map<string, boolean>> {
  return new Map();
}

export async function migrateFromAsyncStorageIfNeeded(): Promise<void> {}
