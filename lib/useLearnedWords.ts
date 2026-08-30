import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getLearnedWordsRevision,
  getLearnedWordsSet,
  subscribeLearnedWords,
} from './learnedWordsCache';
import { refreshLearnedWordsCache } from './savedWordsDb';

/**
 * Learned surfaces from on-device SQLite, held as a Set for O(1) reader checks.
 * Reloads on mount; writes in savedWordsDb refresh the same cache so the current
 * article hides pinyin without a remount.
 */
export function useLearnedWords() {
  const [revision, setRevision] = useState(getLearnedWordsRevision);

  useEffect(() => subscribeLearnedWords(() => setRevision(getLearnedWordsRevision())), []);

  useEffect(() => {
    void refreshLearnedWordsCache();
  }, []);

  const learnedSet = useMemo(() => getLearnedWordsSet(), [revision]);

  const isLearnedWord = useCallback(
    (word: string) => (word ? learnedSet.has(word) : false),
    [learnedSet],
  );

  return {
    learnedSet,
    learnedRevision: revision,
    isLearnedWord,
  };
}
