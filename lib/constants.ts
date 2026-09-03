/**
 * App-wide constants for easier management.
 */

// API
export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 3000;
export const POST_TIMEOUT_MS = 10_000;
/** POST `/translations` (sentence) — longer than generic POSTs (LLM / network). */
export const TRANSLATION_POST_TIMEOUT_MS = 15_000;
/** POST `/audio` (sentence TTS) — generation can be slow. */
export const AUDIO_POST_TIMEOUT_MS = 45_000;
export const GENERATE_SUMMARY_TIMEOUT_MS = 60_000;
export const ARTICLE_REQUEST_TIMEOUT_MS = 8000;
/** Max wait for MP3 load/buffer before reporting playback failure. */
export const AUDIO_PLAY_LOAD_TIMEOUT_MS = 15_000;

// Articles list
export const PAGE_SIZE = 15;

// Create tab / Parse
export const SUPPORTED_URLS = [
  'https://www.zaobao.com',
  'https://m.huanqiu.com',
  'https://www.worldjournal.com',
  'https://www.thepaper.cn',
];
export const MAX_DAILY_PARSES = 20;
export const STORAGE_KEY_DAILY = 'daily_parse_count';
export const STORAGE_KEY_ARTICLES = 'my_articles';

// Article card
export const THUMB_WIDTH = 80;
export const THUMB_MIN_HEIGHT = 50;
export const THUMB_MAX_HEIGHT = 70;
export const TRANSLATION_COUNTDOWN_SECONDS = 15;

// Article detail
/** Public web reader base URL for share links and Android App Links (must match app.json intentFilters). */
export const READER_WEB_BASE_URL = 'https://reader.levelchinese.app';

export function buildArticleShareUrl(articleId: string): string {
  return `${READER_WEB_BASE_URL}/article/${articleId}`;
}

/** Article `FlashList` / `ScrollView` bottom padding: base 32 + after-last-sentence 140 + study region 150. */
export const EXTRA_BOTTOM_PADDING = 300;
export const MAX_CACHED_ARTICLE_DETAILS = 500;
/** 1 week in ms; cached article details younger than this skip background revalidation. */
export const ARTICLE_DETAIL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Font / Settings storage
export const STORAGE_KEY_FONT = '@lcn/useNotoSansSC';
export const STORAGE_KEY_ARTICLE_FONT = '@lcn/articleFont';
export const STORAGE_KEY_REMOTE_FONTS = '@lcn/remoteFonts';
export const STORAGE_KEY_PINYIN = '@lcn/showPinyin';
export const STORAGE_KEY_WORD_HIGHLIGHT = '@lcn/wordHighlight';
export const STORAGE_KEY_LINE_SPACING = '@lcn/lineSpacing';
export const STORAGE_KEY_FONT_SIZE = '@lcn/fontSize';
export const STORAGE_KEY_THEME = '@lcn/darkMode';
export const STORAGE_KEY_NATIVE_LANGUAGE = '@lcn/nativeLanguage';
/** Last Chinese words searched on Learn → Sentence examples */
export const STORAGE_KEY_RECENT_SENTENCE_SEARCHES = '@lcn/recentSentenceSearches';
/** Last article reader route — restored after the OS kills the JS process. */
export const STORAGE_KEY_LAST_ARTICLE_ROUTE = '@lcn/lastArticleRoute';
export const MAX_RECENT_SENTENCE_SEARCHES = 20;

// Stopwords (GET /config/stopwords)
export const STORAGE_KEY_STOP_WORDS = '@lcn/stopwords';
/** 1 day in ms; cached stopwords younger than this skip the remote refetch. */
export const STOP_WORDS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
