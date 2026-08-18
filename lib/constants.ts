/**
 * App-wide constants for easier management.
 */

// API
export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 3000;
export const POST_TIMEOUT_MS = 10_000;
/** POST `/translations` (sentence) — longer than generic POSTs (LLM / network). */
export const TRANSLATION_POST_TIMEOUT_MS = 15_000;
export const GENERATE_SUMMARY_TIMEOUT_MS = 60_000;
export const ARTICLE_REQUEST_TIMEOUT_MS = 8000;

// Articles list
export const PAGE_SIZE = 15;

// Create tab / Parse
export const SUPPORTED_URLS = ['https://www.zaobao.com', 'https://m.huanqiu.com'];
export const MAX_DAILY_PARSES = 20;
export const STORAGE_KEY_DAILY = 'daily_parse_count';
export const STORAGE_KEY_ARTICLES = 'my_articles';

// Article card
export const THUMB_WIDTH = 80;
export const THUMB_MIN_HEIGHT = 50;
export const THUMB_MAX_HEIGHT = 70;
export const TRANSLATION_COUNTDOWN_SECONDS = 15;

// Article detail
export const STUDY_PANEL_HEIGHT = 150;
/** Extra scroll padding so the last sentence can sit above the study panel (incl. multi-line 字 splits). */
export const ARTICLE_STUDY_EXTRA_BOTTOM_PADDING = 140;
export const MAX_CACHED_ARTICLE_DETAILS = 500;
/** 1 week in ms; cached article details younger than this skip background revalidation. */
export const ARTICLE_DETAIL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Font / Settings storage
export const STORAGE_KEY_PINYIN = '@lcn/showPinyin';
export const STORAGE_KEY_LINE_SPACING = '@lcn/lineSpacing';
export const STORAGE_KEY_FONT_SIZE = '@lcn/fontSize';
export const STORAGE_KEY_THEME = '@lcn/darkMode';
export const STORAGE_KEY_NATIVE_LANGUAGE = '@lcn/nativeLanguage';

/** Web: cap content width (~iPad / tablet) with gutters on large desktops. */
export const WEB_MAX_VIEWPORT_WIDTH = 800;
/** Desktop: open settings as a right drawer instead of a full-screen route. */
export const WEB_WIDE_LAYOUT_MIN_WIDTH = 960;
export const WEB_SETTINGS_DRAWER_WIDTH = 400;
/** Mobile: settings sheet height as a fraction of the viewport. */
export const WEB_SETTINGS_SHEET_HEIGHT_RATIO = 0.88;
/** Inner inset used inside the 800px article column (and as the minimum web gutter). */
const WEB_CONTENT_INSET = 20;

/**
 * Horizontal padding so web scroll views can be full-bleed (wheel works in the
 * gutters) while readable content stays ~`WEB_MAX_VIEWPORT_WIDTH`.
 */
export function webContentHorizontalPadding(windowWidth: number): number {
  if (windowWidth <= WEB_MAX_VIEWPORT_WIDTH) return WEB_CONTENT_INSET;
  return (windowWidth - WEB_MAX_VIEWPORT_WIDTH) / 2 + WEB_CONTENT_INSET;
}
