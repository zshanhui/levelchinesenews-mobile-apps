/**
 * Learner native / UI locale codes (aligned with translation API `target_lang`).
 * Add new members here when the backend supports more languages.
 */
export enum NativeLanguage {
  EN = 'en',
  ES = 'es',
  MS = 'ms',
  ID = 'id',
  RU = 'ru',
  AR = 'ar',
  ZH = 'zh',
}

const LEGACY_STORAGE_MAP: Record<string, NativeLanguage> = {
  english: NativeLanguage.EN,
  spanish: NativeLanguage.ES,
  'bahasa-malay': NativeLanguage.MS,
  indonesian: NativeLanguage.ID,
  russian: NativeLanguage.RU,
  arabic: NativeLanguage.AR,
  chinese: NativeLanguage.ZH,
};

/** All supported ISO codes (for storage validation, etc.). */
export const NATIVE_LANGUAGE_CODES = new Set<string>(Object.values(NativeLanguage));

/**
 * Google Translate URL `tl=` code for the learner’s target language.
 * Simplified Chinese uses `zh-CN` in Google’s UI; other codes match our API.
 */
export function googleTranslateTargetLangCode(lang: NativeLanguage): string {
  return lang === NativeLanguage.ZH ? 'zh-CN' : lang;
}

/** Resolve AsyncStorage value to a known code, or null. */
export function parseStoredNativeLanguage(stored: string | null): NativeLanguage | null {
  if (!stored) return null;
  if (NATIVE_LANGUAGE_CODES.has(stored)) return stored as NativeLanguage;
  return LEGACY_STORAGE_MAP[stored] ?? null;
}
