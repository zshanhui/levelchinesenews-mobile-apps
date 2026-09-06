import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY_LAST_ARTICLE_ROUTE } from './constants';

const ARTICLE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LastArticleRoute = {
  id: string;
  word?: string;
  wordKey?: string;
  sentenceKey?: string;
};

export function isArticleId(id: string): boolean {
  return ARTICLE_ID_RE.test(id);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function parseLastArticleRoute(value: unknown): LastArticleRoute | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = optionalString(record.id);
  if (!id || !isArticleId(id)) return null;
  return {
    id,
    word: optionalString(record.word),
    wordKey: optionalString(record.wordKey),
    sentenceKey: optionalString(record.sentenceKey),
  };
}

/**
 * Parse `lcn://article/{id}` or `https://reader.levelchinese.app/article/{id}`
 * (optional word / wordKey / sentenceKey query params).
 */
export function parseArticleRouteFromUrl(
  url: string | null | undefined,
): LastArticleRoute | null {
  if (!url) return null;
  try {
    let pathAndQuery: string;
    if (url.startsWith('lcn://')) {
      pathAndQuery = url.slice('lcn://'.length);
    } else {
      const parsed = new URL(url);
      pathAndQuery = `${parsed.pathname}${parsed.search}`;
    }
    const [rawPath, queryString] = pathAndQuery.split('?');
    const path = rawPath.replace(/^\//, '');
    const match = path.match(/^article\/([^/]+)/);
    if (!match) return null;
    const id = decodeURIComponent(match[1]);
    if (!isArticleId(id)) return null;
    const params = new URLSearchParams(queryString ?? '');
    return {
      id,
      word: optionalString(params.get('word')),
      wordKey: optionalString(params.get('wordKey')),
      sentenceKey: optionalString(params.get('sentenceKey')),
    };
  } catch {
    return null;
  }
}

export function lastArticleRouteHref(route: LastArticleRoute): string {
  const params = new URLSearchParams();
  if (route.word) params.set('word', route.word);
  if (route.wordKey) params.set('wordKey', route.wordKey);
  if (route.sentenceKey) params.set('sentenceKey', route.sentenceKey);
  const qs = params.toString();
  return qs ? `/article/${route.id}?${qs}` : `/article/${route.id}`;
}

export function pathnameHasArticle(pathname: string | undefined, id: string): boolean {
  if (!pathname) return false;
  return pathname.includes(`/article/${id}`);
}

export async function loadLastArticleRoute(): Promise<LastArticleRoute | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LAST_ARTICLE_ROUTE);
    if (!raw) return null;
    return parseLastArticleRoute(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveLastArticleRoute(route: LastArticleRoute): Promise<void> {
  const parsed = parseLastArticleRoute(route);
  if (!parsed) return;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_LAST_ARTICLE_ROUTE,
      JSON.stringify(parsed),
    );
  } catch {
    // ignore persistence failures
  }
}

/** Clear only if storage is empty or still points at `id` (avoids racing a newer save). */
export async function clearLastArticleRoute(id?: string): Promise<void> {
  try {
    if (id) {
      const current = await loadLastArticleRoute();
      if (current && current.id !== id) return;
    }
    await AsyncStorage.removeItem(STORAGE_KEY_LAST_ARTICLE_ROUTE);
  } catch {
    // ignore persistence failures
  }
}

/** Deep link wins over the last-read article saved before a process kill. */
export async function resolveLaunchArticleRoute(
  initialUrl: string | null | undefined,
): Promise<LastArticleRoute | null> {
  return parseArticleRouteFromUrl(initialUrl) ?? loadLastArticleRoute();
}
