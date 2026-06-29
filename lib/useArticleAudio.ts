import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from './i18n';
import { apiReadUrl, fetchWithTimeout, getUserFriendlyErrorMessage } from './api';
import { ARTICLE_REQUEST_TIMEOUT_MS } from './constants';
import type { ArticleAudioResponse, AudioPostResponse, StoredAudioEntry } from './types';

/** Merge a POST /audio response into the GET-shaped cache (no full refetch). */
export function mergeAudioResponseIntoArticleAudio(
  prev: ArticleAudioResponse | null,
  res: AudioPostResponse,
): ArticleAudioResponse {
  const sentenceKey = `${res.paragraph_index}:${res.sentence_index}`;
  const entry: StoredAudioEntry = {
    audio_url: res.audio_url,
    /** POST body omits hash; GET merges use this for display-only rows. */
    source_text_hash: '',
    content_type: 'audio/mpeg',
    created_at: new Date().toISOString(),
  };
  const base = prev ?? {
    article_id: res.article_id,
    default_voice_id: res.voice_id,
    article_sentence: {},
    article_full: null,
  };
  const prevInner = base.article_sentence[sentenceKey] ?? {};
  return {
    ...base,
    article_id: res.article_id,
    default_voice_id: base.default_voice_id || res.voice_id,
    article_sentence: {
      ...base.article_sentence,
      [sentenceKey]: {
        ...prevInner,
        [res.voice_id]: entry,
      },
    },
  };
}

/** Cached audio entry for a sentence using the response `default_voice_id`. */
export function getCachedSentenceAudioEntry(
  articleAudio: ArticleAudioResponse | null | undefined,
  sentenceKey: string,
): StoredAudioEntry | null {
  const voiceId = articleAudio?.default_voice_id?.trim();
  if (!voiceId) return null;
  const entry = articleAudio?.article_sentence?.[sentenceKey]?.[voiceId];
  if (!entry?.audio_url?.trim()) return null;
  return entry;
}

/** True if GET /audio payload has a cached clip for this sentence at `default_voice_id`. */
export function hasCachedSentenceAudio(
  articleAudio: ArticleAudioResponse | null | undefined,
  sentenceKey: string,
): boolean {
  return getCachedSentenceAudioEntry(articleAudio, sentenceKey) != null;
}

/**
 * Fetches cached sentence audio for an article (`GET /audio?article_id=…`).
 *
 * @param enabled — Set `true` only after the article is loaded (e.g. `!!article` from `useArticle`).
 *   Avoid gating on `loading` if you want cached audio to stay visible during article refetch.
 */
export function useArticleAudio(articleId: string | undefined, enabled: boolean) {
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
      const url = apiReadUrl('/audio', { article_id: articleId });
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
  }, [articleId, enabled, t]);

  useEffect(() => {
    void fetchArticleAudio();
  }, [fetchArticleAudio]);

  return {
    articleAudio,
    loading,
    error,
    refetch: fetchArticleAudio,
  };
}
