/**
 * App-wide constants for easier management.
 */

// API
export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 3000;
export const POST_TIMEOUT_MS = 10_000;
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
export const THUMB_MAX_HEIGHT = 120;
export const TRANSLATION_COUNTDOWN_SECONDS = 15;

// Article detail
export const STUDY_PANEL_HEIGHT = 150;
export const MAX_CACHED_ARTICLE_DETAILS = 500;
/** 1 week in ms; cached article details younger than this skip background revalidation. */
export const ARTICLE_DETAIL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Font / Settings storage
export const STORAGE_KEY_FONT = '@lcn/useNotoSansSC';
export const STORAGE_KEY_PINYIN = '@lcn/showPinyin';
export const STORAGE_KEY_LINE_SPACING = '@lcn/lineSpacing';
export const STORAGE_KEY_FONT_SIZE = '@lcn/fontSize';
export const STORAGE_KEY_THEME = '@lcn/darkMode';
export const STORAGE_KEY_NATIVE_LANGUAGE = '@lcn/nativeLanguage';
