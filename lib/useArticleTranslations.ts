import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import { NativeLanguage } from './nativeLanguage';
import { useNativeLanguage } from './NativeLanguageContext';
import type {
  ArticleTranslationsResponse,
  StoredTranslationEntry,
  TranslationResponse,
} from './types';

/** Merge a POST /translations response into the GET-shaped cache (no full refetch). */
export function mergeTranslationResponseIntoArticleTranslations(
  prev: ArticleTranslationsResponse | null,
  res: TranslationResponse,
): ArticleTranslationsResponse {
  if (res.paragraph_index == null || res.sentence_index == null) {
    return prev ?? { article_id: res.article_id, article_sentence: {} };
  }
  const sentenceKey = `${res.paragraph_index}:${res.sentence_index}`;
  const entry: StoredTranslationEntry = {
    translated_text: res.translated_text,
    /** POST body omits hash; GET merges use this for display-only rows. */
    source_text_hash: '',
    provider: res.provider ?? 'api',
    created_at: new Date().toISOString(),
  };
  const base = prev ?? { article_id: res.article_id, article_sentence: {} };
  const prevInner = base.article_sentence[sentenceKey] ?? {};
  return {
    article_id: res.article_id,
    article_sentence: {
      ...base.article_sentence,
      [sentenceKey]: {
        ...prevInner,
        [res.target_lang]: entry,
      },
    },
  };
}

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

  const mergeTranslationFromPost = useCallback((res: TranslationResponse) => {
    setTranslations((prev) => mergeTranslationResponseIntoArticleTranslations(prev, res));
  }, []);

  useEffect(() => {
    void fetchTranslations();
  }, [fetchTranslations]);

  return {
    translations,
    translationLang,
    loading,
    error,
    refetch: fetchTranslations,
    mergeTranslationFromPost,
  };
}
