import { useCallback, useState } from 'react';
import { apiWriteUrl, envConfig, getUserFriendlyErrorMessage, postWithTimeout } from './api';
import { TRANSLATION_POST_TIMEOUT_MS } from './constants';
import { useNativeLanguage } from './NativeLanguageContext';
import { useTranslation } from './i18n';
import { sentryCaptureException } from './monitoring';
import { TranslationKind, type TranslationResponse } from './types';
import { translationLangForNative } from './useArticleTranslations';

/** For Sentry tags when POST /translations fails (timeout, network, HTTP, etc.). */
function classifySentenceTranslateFailure(err: unknown): string {
  if (err instanceof Error && err.name === 'AbortError') return 'timeout';
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('abort')) return 'timeout';
  if (err instanceof TypeError && msg.includes('fetch')) return 'network';
  if (msg.includes('failed to fetch') || msg.includes('network request failed')) {
    return 'network';
  }
  if (msg.includes('api error:')) return 'http';
  return 'other';
}

/** Serialize POST `/translations` so only one request runs at a time (queued). */
let translationPostLockTail = Promise.resolve();

export type TranslateSentenceParams = {
  articleId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  /** Chinese sentence text (must match `parsed_content` at the given indices) */
  sourceText: string;
};

/**
 * POST `/translations` to translate one sentence into the learner’s target language.
 * Uses `translationLangForNative`: Chinese-native learners get **English** (`en`).
 */
export function useTranslateSentence() {
  const { t } = useTranslation();
  const { nativeLanguage } = useNativeLanguage();
  const targetLang = translationLangForNative(nativeLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateSentence = useCallback(
    async (params: TranslateSentenceParams): Promise<TranslationResponse> => {
      const trimmed = params.sourceText.trim();
      if (!trimmed) {
        throw new Error('sourceText is empty');
      }
      setError(null);
      const url = apiWriteUrl('/translations');
      const headers: Record<string, string> = {};
      if (envConfig.tempAdminAccessWriteKey) {
        headers['X-Admin-Key'] = envConfig.tempAdminAccessWriteKey;
      }
      const body = {
        kind: TranslationKind.ArticleSentence,
        article_id: params.articleId,
        paragraph_index: params.paragraphIndex,
        sentence_index: params.sentenceIndex,
        source_text: trimmed,
        target_lang: targetLang,
      };
      try {
        const prev = translationPostLockTail;
        let releaseLock!: () => void;
        translationPostLockTail = new Promise<void>((r) => {
          releaseLock = r;
        });
        await prev;
        setLoading(true);
        try {
          return await postWithTimeout<TranslationResponse>(
            url,
            body,
            TRANSLATION_POST_TIMEOUT_MS,
            Object.keys(headers).length ? headers : undefined,
          );
        } finally {
          releaseLock();
          setLoading(false);
        }
      } catch (err) {
        const message = getUserFriendlyErrorMessage(err, t('somethingWentWrong'));
        setError(message);
        sentryCaptureException(err instanceof Error ? err : new Error(message), {
          level: 'warning',
          tags: {
            feature: 'sentence_translation_post',
            failure_kind: classifySentenceTranslateFailure(err),
          },
          contexts: {
            translation_request: {
              article_id: params.articleId,
              paragraph_index: params.paragraphIndex,
              sentence_index: params.sentenceIndex,
              target_lang: targetLang,
              source_text_length: trimmed.length,
            },
          },
        });
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [targetLang, t],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    translateSentence,
    targetLang,
    loading,
    error,
    clearError,
  };
}
