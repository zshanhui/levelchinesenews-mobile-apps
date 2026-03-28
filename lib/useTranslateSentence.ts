import { useCallback, useState } from 'react';
import { apiWriteUrl, envConfig, getUserFriendlyErrorMessage, postWithTimeout } from './api';
import { POST_TIMEOUT_MS } from './constants';
import { useNativeLanguage } from './NativeLanguageContext';
import { useTranslation } from './i18n';
import { TranslationKind, type TranslationResponse } from './types';
import { translationLangForNative } from './useArticleTranslations';

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
      setLoading(true);
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
        return await postWithTimeout<TranslationResponse>(
          url,
          body,
          POST_TIMEOUT_MS,
          Object.keys(headers).length ? headers : undefined,
        );
      } catch (err) {
        const message = getUserFriendlyErrorMessage(err, t('somethingWentWrong'));
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
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
