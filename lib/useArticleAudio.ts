import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import type { ArticleAudioResponse, StoredAudioEntry } from './types';

/** Default app voice key for Phase 1; matches backend `DEFAULT_TTS_VOICE_KEY`. */
export const DEFAULT_ARTICLE_AUDIO_VOICE_ID = 'lei-jun';

/** Cached audio entry for a sentence and voice, or null when missing. `sentenceKey` is `p:s` (API shape). */
export function getCachedSentenceAudioEntry(
  articleAudio: ArticleAudioResponse | null | undefined,
  voiceId: string,
  sentenceKey: string,
): StoredAudioEntry | null {
  const entry = articleAudio?.article_sentence?.[sentenceKey]?.[voiceId];
  if (!entry?.audio_url?.trim()) return null;
  return entry;
}

/** True if GET /audio payload has a cached clip for this sentence and voice. */
export function hasCachedSentenceAudio(
  articleAudio: ArticleAudioResponse | null | undefined,
  voiceId: string,
  sentenceKey: string,
): boolean {
  return getCachedSentenceAudioEntry(articleAudio, voiceId, sentenceKey) != null;
}

/**
 * Fetches cached sentence audio for an article (`GET /audio?voice_id=…`).
 *
 * @param enabled — Set `true` only after the article is loaded (e.g. `!!article` from `useArticle`).
 *   Avoid gating on `loading` if you want cached audio to stay visible during article refetch.
 */
export function useArticleAudio(
  articleId: string | undefined,
  enabled: boolean,
  voiceId: string = DEFAULT_ARTICLE_AUDIO_VOICE_ID,
) {
  const { t } = useTranslation();
  const [articleAudio, setArticleAudio] = useState<ArticleAudioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticleAudio = useCallback(async () => {
    if (!articleId || !enabled) {
      setArticleAudio(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = apiReadUrl('/audio', {
        article_id: articleId,
        voice_id: voiceId,
      });
      const data = await fetchWithTimeout<ArticleAudioResponse>(
        url,
        ARTICLE_REQUEST_TIMEOUT_MS,
      );
      setArticleAudio(data);
    } catch (err) {
      setArticleAudio(null);
      setError(getUserFriendlyErrorMessage(err, t('somethingWentWrong')));
    } finally {
      setLoading(false);
    }
  }, [articleId, enabled, voiceId, t]);

  useEffect(() => {
    void fetchArticleAudio();
  }, [fetchArticleAudio]);

  return {
    articleAudio,
    voiceId,
    loading,
    error,
    refetch: fetchArticleAudio,
  };
}
