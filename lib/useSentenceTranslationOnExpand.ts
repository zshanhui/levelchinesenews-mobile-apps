import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserFriendlyErrorMessage, isOfflineOrNetworkFailure } from './api';
import { useTranslation } from './i18n';
import type { NativeLanguage } from './nativeLanguage';
import { parseSentenceKey } from './sentenceKeys';
import { sentenceFullText } from './text-utils';
import type { ArticleTranslationsResponse, ParsedParagraph, TranslationResponse } from './types';
import { getCachedSentenceTranslationText } from './useArticleTranslations';
import { useTranslateSentence } from './useTranslateSentence';

export type UseSentenceTranslationOnExpandParams = {
  parsedContent: ParsedParagraph[];
  highlightedSentenceKey: string | null;
  articleTranslations: ArticleTranslationsResponse | null | undefined;
  translationLang: NativeLanguage | undefined;
  articleId: string | undefined;
  mergeTranslationFromPost: ((res: TranslationResponse) => void) | undefined;
};

/**
 * Sentence translate panel open state + POST /translations on cache miss when expanded.
 * Successful POST responses always merge into the article translation cache (even if the user
 * navigated away) so the toggle reflects cached translations. Errors use a stale-request guard.
 */
export function useSentenceTranslationOnExpand({
  parsedContent,
  highlightedSentenceKey,
  articleTranslations,
  translationLang,
  articleId,
  mergeTranslationFromPost,
}: UseSentenceTranslationOnExpandParams) {
  const { t } = useTranslation();
  const [sentenceTranslateExpanded, setSentenceTranslateExpanded] = useState(false);
  const [translatingSentenceKey, setTranslatingSentenceKey] = useState<string | null>(null);
  const [sentenceTranslateError, setSentenceTranslateError] = useState<string | null>(null);
  /** Incremented when the user closes the panel or starts a new request — older POSTs must no-op. */
  const requestGenerationRef = useRef(0);
  const { translateSentence } = useTranslateSentence();

  // New sentence selection → close translate panel and clear POST error
  useEffect(() => {
    setSentenceTranslateExpanded(false);
    setSentenceTranslateError(null);
  }, [highlightedSentenceKey]);

  // Panel closed → drop loading UI, clear error, invalidate any in-flight POST
  useEffect(() => {
    if (!sentenceTranslateExpanded) {
      requestGenerationRef.current += 1;
      setTranslatingSentenceKey(null);
      setSentenceTranslateError(null);
    }
  }, [sentenceTranslateExpanded]);

  // Panel open + cache miss → POST, merge locally, handle errors
  useEffect(() => {
    if (
      !sentenceTranslateExpanded ||
      !highlightedSentenceKey ||
      !articleId ||
      !mergeTranslationFromPost ||
      !translationLang
    ) {
      return;
    }

    const merge = mergeTranslationFromPost;
    const lang = translationLang;
    const sentenceKey = highlightedSentenceKey;
    const resolvedArticleId = articleId;

    const cached = getCachedSentenceTranslationText(articleTranslations, lang, sentenceKey);
    if (cached) return;

    const indices = parseSentenceKey(sentenceKey);
    if (!indices) return;

    const { paragraphIndex, sentenceIndex } = indices;
    const sentence = parsedContent[paragraphIndex]?.s[sentenceIndex];
    if (!sentence) return;

    const generation = ++requestGenerationRef.current;
    setTranslatingSentenceKey(sentenceKey);
    setSentenceTranslateError(null);

    const stillCurrent = () => generation === requestGenerationRef.current;

    async function postTranslation() {
      try {
        const res = await translateSentence({
          articleId: resolvedArticleId,
          paragraphIndex,
          sentenceIndex,
          sourceText: sentenceFullText(sentence),
        });
        merge(res);
      } catch (err) {
        if (!stillCurrent()) return;
        const message = isOfflineOrNetworkFailure(err)
          ? t('networkUnstableOrOff')
          : getUserFriendlyErrorMessage(err, t('somethingWentWrong'));
        setSentenceTranslateError(message);
      } finally {
        if (stillCurrent()) {
          setTranslatingSentenceKey(null);
        }
      }
    }

    void postTranslation();
  }, [
    sentenceTranslateExpanded,
    highlightedSentenceKey,
    articleId,
    articleTranslations,
    translationLang,
    mergeTranslationFromPost,
    parsedContent,
    translateSentence,
    t,
  ]);

  const onSentenceTranslatePress = useCallback(() => {
    if (
      translatingSentenceKey !== null &&
      translatingSentenceKey === highlightedSentenceKey
    ) {
      return;
    }
    setSentenceTranslateExpanded((prev) => !prev);
  }, [translatingSentenceKey, highlightedSentenceKey]);

  return {
    sentenceTranslateExpanded,
    translatingSentenceKey,
    sentenceTranslateError,
    onSentenceTranslatePress,
  };
}
