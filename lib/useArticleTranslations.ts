import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import { NativeLanguage } from './nativeLanguage';
import { useNativeLanguage } from './NativeLanguageContext';
import type { ArticleTranslationsResponse } from './types';

/** Cached translation for the learner’s target language, or null. `sentenceKey` is `p:s` (API shape). */
export function getCachedSentenceTranslationText(
  translations: ArticleTranslationsResponse | null | undefined,
  translationLang: NativeLanguage | undefined,
  sentenceKey: string,
): string | null {
  if (!translationLang) return null;
  if (!translations?.article_sentence) return null;
  const text = translations.article_sentence[sentenceKey]?.[translationLang]?.translated_text?.trim();
  return text ? text : null;
}

/** True if GET /translations payload has a non-empty cached line for this sentence and lang. */
export function hasCachedSentenceTranslation(
  translations: ArticleTranslationsResponse | null | undefined,
  translationLang: NativeLanguage | undefined,
  sentenceKey: string,
): boolean {
  return getCachedSentenceTranslationText(translations, translationLang, sentenceKey) != null;
}

/**
 * Target language for sentence translation API (`GET`/`POST` `lang` / `target_lang`).
 * Matches the user's native language except Chinese-native users get English glosses.
 */
export function translationLangForNative(nativeLanguage: NativeLanguage): NativeLanguage {
  return nativeLanguage === NativeLanguage.ZH ? NativeLanguage.EN : nativeLanguage;
}

/**
 * Fetches cached sentence translations for an article (`GET /translations?lang=…`).
 *
 * @param enabled — Set `true` only after the article is loaded (e.g. `!!article` from `useArticle`).
 *   Avoid gating on `loading` if you want cached translations to stay visible during article refetch.
 */
export function useArticleTranslations(
  articleId: string | undefined,
  enabled: boolean,
) {
  const { t } = useTranslation();
  const { nativeLanguage } = useNativeLanguage();
  const translationLang = translationLangForNative(nativeLanguage);
  const [translations, setTranslations] = useState<ArticleTranslationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranslations = useCallback(async () => {
    if (!articleId || !enabled) {
      setTranslations(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = apiReadUrl('/translations', {
        article_id: articleId,
        lang: translationLang,
      });
      const data = await fetchWithTimeout<ArticleTranslationsResponse>(
        url,
        ARTICLE_REQUEST_TIMEOUT_MS,
      );
      setTranslations(data);
    } catch (err) {
      setTranslations(null);
      setError(getUserFriendlyErrorMessage(err, t('somethingWentWrong')));
    } finally {
      setLoading(false);
    }
  }, [articleId, enabled, translationLang, t]);

  useEffect(() => {
    void fetchTranslations();
  }, [fetchTranslations]);

  return {
    translations,
    translationLang,
    loading,
    error,
    refetch: fetchTranslations,
  };
}
