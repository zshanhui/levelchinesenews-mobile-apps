import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getUserFriendlyErrorMessage,
  isOfflineOrNetworkFailure,
  resolveAudioUrl,
} from './api';
import { useTranslation } from './i18n';
import { parseSentenceKey } from './sentenceKeys';
import type { ArticleAudioResponse, AudioPostResponse } from './types';
import { getCachedSentenceAudioEntry } from './useArticleAudio';
import { useCreateSentenceAudio } from './useCreateSentenceAudio';

export type UseSentenceAudioOnPressParams = {
  articleId: string | undefined;
  articleAudio: ArticleAudioResponse | null | undefined;
  highlightedSentenceKey: string | null;
  mergeAudioFromPost: ((res: AudioPostResponse) => void) | undefined;
  playSentenceAudio: (sentenceKey: string, resolvedUrl: string) => void;
};

/**
 * Sentence audio button: play cached clip, or POST /audio on miss, merge, then play.
 * Successful POSTs always merge into the article audio cache. Playback and error UI
 * use a stale-request guard when the selected sentence changes.
 */
export function useSentenceAudioOnPress({
  articleId,
  articleAudio,
  highlightedSentenceKey,
  mergeAudioFromPost,
  playSentenceAudio,
}: UseSentenceAudioOnPressParams) {
  const { t } = useTranslation();
  const [generatingAudioSentenceKey, setGeneratingAudioSentenceKey] = useState<string | null>(
    null,
  );
  const [sentenceAudioError, setSentenceAudioError] = useState<string | null>(null);
  /** Incremented when selection changes or a new request starts — older POSTs must no-op UI. */
  const requestGenerationRef = useRef(0);
  const { createSentenceAudio } = useCreateSentenceAudio();

  useEffect(() => {
    requestGenerationRef.current += 1;
    setGeneratingAudioSentenceKey(null);
    setSentenceAudioError(null);
  }, [highlightedSentenceKey]);

  const onAudioPress = useCallback(
    (sentenceKey: string) => {
      if (generatingAudioSentenceKey === sentenceKey) return;

      const entry = getCachedSentenceAudioEntry(articleAudio, sentenceKey);
      const cachedUrl = resolveAudioUrl(entry?.audio_url);
      if (cachedUrl) {
        setSentenceAudioError(null);
        playSentenceAudio(sentenceKey, cachedUrl);
        return;
      }

      if (!articleId || !mergeAudioFromPost) return;

      const indices = parseSentenceKey(sentenceKey);
      if (!indices) return;

      const merge = mergeAudioFromPost;
      const resolvedArticleId = articleId;
      const generation = ++requestGenerationRef.current;
      setGeneratingAudioSentenceKey(sentenceKey);
      setSentenceAudioError(null);

      const stillCurrent = () => generation === requestGenerationRef.current;

      void (async () => {
        try {
          const res = await createSentenceAudio({
            articleId: resolvedArticleId,
            paragraphIndex: indices.paragraphIndex,
            sentenceIndex: indices.sentenceIndex,
            force: false,
          });
          merge(res);
          if (!stillCurrent()) return;
          const url = resolveAudioUrl(res.audio_url);
          if (url) {
            playSentenceAudio(sentenceKey, url);
          }
        } catch (err) {
          if (!stillCurrent()) return;
          const message = isOfflineOrNetworkFailure(err)
            ? t('networkUnstableOrOff')
            : getUserFriendlyErrorMessage(err, t('somethingWentWrong'));
          setSentenceAudioError(message);
        } finally {
          if (stillCurrent()) {
            setGeneratingAudioSentenceKey(null);
          }
        }
      })();
    },
    [
      articleAudio,
      articleId,
      createSentenceAudio,
      generatingAudioSentenceKey,
      mergeAudioFromPost,
      playSentenceAudio,
      t,
    ],
  );

  return {
    onAudioPress,
    generatingAudioSentenceKey,
    sentenceAudioError,
  };
}
