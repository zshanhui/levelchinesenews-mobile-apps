import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserFriendlyErrorMessage, isOfflineOrNetworkFailure } from './api';
import { useTranslation } from './i18n';
import type { NativeLanguage } from './nativeLanguage';
import type { ArticleTranslationsResponse, ParsedParagraph, Sentence, TranslationResponse } from './types';
import { getCachedSentenceTranslationText } from './useArticleTranslations';
import { useTranslateSentence } from './useTranslateSentence';

function sentenceSourceText(sentence: Sentence): string {
  return sentence.f;
}

/** Parse `paragraphIndex:sentenceIndex` from the sentence key used in the article UI. */
function parseParagraphAndSentenceIndices(sentenceKey: string): { paragraphIndex: number; sentenceIndex: number } | null {
  const parts = sentenceKey.split(':');
  if (parts.length !== 2) return null;
  const paragraphIndex = Number.parseInt(parts[0]!, 10);
  const sentenceIndex = Number.parseInt(parts[1]!, 10);
  if (!Number.isFinite(paragraphIndex) || !Number.isFinite(sentenceIndex)) return null;
  return { paragraphIndex, sentenceIndex };
}

export type UseSentenceTranslationOnExpandParams = {
  parsedContent: ParsedParagraph[];
  highlightedSentenceKey: string | null;
  articleTranslations: ArticleTranslationsResponse | null | undefined;
  translationLang: NativeLanguage | undefined;
  articleId: string | undefined;
  mergeTranslationFromPost: ((res: TranslationResponse) => void) | undefined;
};

/**
 * Sentence translate panel open state + POST /translations on cache miss when expanded,
 * with stale-request guards and `translatingSentenceKey` for row-level loading UI.
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
  const { translateSentence, loading: translateSentenceHookLoading } = useTranslateSentence();

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

    const indices = parseParagraphAndSentenceIndices(sentenceKey);
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
          sourceText: sentenceSourceText(sentence),
        });
        if (!stillCurrent()) return;
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
    if (translatingSentenceKey !== null || translateSentenceHookLoading) {
      return;
    }
    setSentenceTranslateExpanded((prev) => !prev);
  }, [translatingSentenceKey, translateSentenceHookLoading]);

  return {
    sentenceTranslateExpanded,
    translatingSentenceKey,
    translateSentenceHookLoading,
    sentenceTranslateError,
    onSentenceTranslatePress,
  };
}
