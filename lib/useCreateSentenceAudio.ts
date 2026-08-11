import { useCallback, useState } from 'react';
import { apiWriteUrl, envConfig, getUserFriendlyErrorMessage, postWithTimeout } from './api';
import { AUDIO_POST_TIMEOUT_MS } from './constants';
import { useTranslation } from './i18n';
import { captureTrackedException } from './monitoring';
import { AudioKind, type AudioPostResponse } from './types';

/** Classify POST /audio failures (timeout, network, HTTP, etc.) for GlitchTip tags. */
function classifySentenceAudioPostFailure(err: unknown): string {
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

/** Serialize POST `/audio` so only one request runs at a time (queued). */
let audioPostLockTail = Promise.resolve();

export type CreateSentenceAudioParams = {
  articleId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  /** App voice key (e.g. `lei-jun`). Omit to let the backend pick the article default. */
  voiceId?: string;
  /** Regenerate even when a matching cache row exists. */
  force?: boolean;
};

/**
 * POST `/audio` to generate Mandarin TTS for one sentence.
 * Sentence text is resolved server-side from `parsed_content` at the given indices.
 */
export function useCreateSentenceAudio() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const createSentenceAudio = useCallback(
    async (params: CreateSentenceAudioParams): Promise<AudioPostResponse> => {
      setError(null);
      const url = apiWriteUrl('/audio');
      const headers: Record<string, string> = {};
      if (envConfig.tempAdminAccessWriteKey) {
        headers['X-Admin-Key'] = envConfig.tempAdminAccessWriteKey;
      }
      const body: Record<string, unknown> = {
        kind: AudioKind.ArticleSentence,
        article_id: params.articleId,
        paragraph_index: params.paragraphIndex,
        sentence_index: params.sentenceIndex,
        force: params.force ?? false,
      };
      const voiceId = params.voiceId?.trim();
      if (voiceId) {
        body.voice_id = voiceId;
      }
      try {
        const prev = audioPostLockTail;
        let releaseLock!: () => void;
        audioPostLockTail = new Promise<void>((resolve: () => void) => {
          releaseLock = resolve;
        });
        await prev;
        try {
          return await postWithTimeout<AudioPostResponse>(
            url,
            body,
            AUDIO_POST_TIMEOUT_MS,
            Object.keys(headers).length ? headers : undefined,
          );
        } finally {
          releaseLock();
        }
      } catch (err) {
        const message = getUserFriendlyErrorMessage(err, t('somethingWentWrong'));
        setError(message);
        captureTrackedException(err instanceof Error ? err : new Error(message), {
          level: 'warning',
          tags: {
            feature: 'sentence_audio_post',
            failure_kind: classifySentenceAudioPostFailure(err),
          },
          contexts: {
            audio_request: {
              article_id: params.articleId,
              paragraph_index: params.paragraphIndex,
              sentence_index: params.sentenceIndex,
              voice_id: voiceId ?? null,
              force: params.force ?? false,
            },
          },
        });
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [t],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    createSentenceAudio,
    error,
    clearError,
  };
}
