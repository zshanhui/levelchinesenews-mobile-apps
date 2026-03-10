import {
  API_PREFIX,
  GENERATE_SUMMARY_TIMEOUT_MS,
  POST_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
} from './constants';
import type { ArticleListItem } from './types';

export const envConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL,
  apiWriteBaseUrl: process.env.EXPO_PUBLIC_API_WRITE_URL,
  tempAdminAccessWriteKey: process.env.EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY,
}

if (!envConfig.apiBaseUrl?.trim()) {
  throw new Error('EXPO_PUBLIC_API_URL is required. Set it in .env or app.json config.');
}
if (!envConfig.apiWriteBaseUrl?.trim()) {
  throw new Error('EXPO_PUBLIC_API_WRITE_URL is required. Set it in .env or app.json config.');
}
if (!envConfig.tempAdminAccessWriteKey?.trim()) {
  throw new Error('EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY is required. Set it in .env or app.json config.');
}

/** Convert raw API/network errors to user-friendly messages. */
export function getUserFriendlyErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // Timeout (AbortController.abort())
  if (err instanceof Error && err.name === 'AbortError') return 'Request timed out. Please try again.';
  if (lower.includes('abort')) return 'Request timed out. Please try again.';

  // Network/connection errors
  if (err instanceof TypeError && lower.includes('fetch')) return 'Unable to connect. Please check your internet connection.';
  if (lower.includes('failed to fetch') || lower.includes('network request failed')) return 'Unable to connect. Please check your internet connection.';

  // Server errors (5xx) - avoid exposing raw status
  if (/api error:\s*5\d{2}/.test(lower) || lower.includes('502') || lower.includes('503')) return 'Server error. Please try again later.';

  // Not found (404)
  if (lower.includes('404')) return 'Not found.';

  // Preserve server-provided detail (e.g. "Unsupported news source. Supported: zaobao.com")
  if (msg && !lower.startsWith('api error:')) return msg;

  return fallback;
}

export function apiReadUrl(path: string, params?: Record<string, string | number | boolean>): string {
  const url = `${envConfig.apiBaseUrl}${API_PREFIX}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
  return `${url}?${search.toString()}`;
}

/** Build full URL for write endpoints (scrape, generate_summary) using envConfig.apiWriteBaseUrl. */
export function apiWriteUrl(path: string, params?: Record<string, string | number | boolean>): string {
  const url = `${envConfig.apiWriteBaseUrl}${API_PREFIX}${path}`;
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
  const base = envConfig.apiBaseUrl!.replace(/\/$/, '');
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
  const url = apiWriteUrl(`/articles/${articleId}/generate_summary`);
  const headers: Record<string, string> = {};
  if (envConfig.tempAdminAccessWriteKey) {
    headers['X-Admin-Key'] = envConfig.tempAdminAccessWriteKey;
  }
  return postWithTimeout<ArticleListItem>(
    url,
    {},
    GENERATE_SUMMARY_TIMEOUT_MS,
    Object.keys(headers).length ? headers : undefined,
  );
}
