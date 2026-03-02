import type { ArticleListItem } from './types';

/** API base URL. Override with EXPO_PUBLIC_API_URL for different environments. */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  (__DEV__ ? 'http://localhost:8000' : process.env.EXPO_PUBLIC_API_URL);

/** Admin key for protected endpoints (e.g. scrape). Set EXPO_PUBLIC_ADMIN_ACCESS_KEY to match server ADMIN_ACCESS_KEY. */
export const ADMIN_ACCESS_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ADMIN_ACCESS_KEY) || '';

const API_PREFIX = '/api/v1';
const REQUEST_TIMEOUT_MS = 3000;

export function apiUrl(path: string, params?: Record<string, string | number | boolean>): string {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
  return `${url}?${search.toString()}`;
}

/** Resolve main_image to an absolute URL. When backend uses local storage, it returns paths like /api/v1/images/foo.jpg. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = API_BASE_URL?.replace(/\/$/, '') ?? '';
  return base ? `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` : trimmed;
}

export async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Fetch with timeout. Throws on timeout or network error. */
export async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

const POST_TIMEOUT_MS = 5_000;
const GENERATE_SUMMARY_TIMEOUT_MS = 60_000;

/** POST JSON with timeout. Parses error detail from response body when possible. */
export async function postWithTimeout<T>(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number = POST_TIMEOUT_MS,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let detail: string | undefined;
      try {
        const json = await res.json();
        detail = json.detail;
      } catch { }
      throw new Error(detail ?? `API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Generate translated title and summary for an article via LLM. Returns updated article. */
export async function generateArticleSummary(articleId: string): Promise<ArticleListItem> {
  const url = apiUrl(`/articles/${articleId}/generate_summary`);
  const headers: Record<string, string> = {};
  if (ADMIN_ACCESS_KEY) {
    headers['X-Admin-Key'] = ADMIN_ACCESS_KEY;
  }
  return postWithTimeout<ArticleListItem>(
    url,
    {},
    GENERATE_SUMMARY_TIMEOUT_MS,
    Object.keys(headers).length ? headers : undefined,
  );
}
