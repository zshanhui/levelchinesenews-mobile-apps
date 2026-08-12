/** Article UI sentence key: `paragraphIndex:sentenceIndex`. */

export type SentenceIndices = {
  paragraphIndex: number;
  sentenceIndex: number;
};

/** Build the sentence key used in article UI / cache maps. */
export function formatSentenceKey(
  paragraphIndex: number,
  sentenceIndex: number,
): string {
  return `${paragraphIndex}:${sentenceIndex}`;
}

/**
 * Parse `paragraphIndex:sentenceIndex` from a sentence key.
 * Returns null when the key is malformed or indices are not integers.
 */
export function parseSentenceKey(sentenceKey: string): SentenceIndices | null {
  const parts = sentenceKey.split(':');
  if (parts.length !== 2) return null;
  const paragraphIndex = Number.parseInt(parts[0]!, 10);
  const sentenceIndex = Number.parseInt(parts[1]!, 10);
  if (!Number.isInteger(paragraphIndex) || !Number.isInteger(sentenceIndex)) {
    return null;
  }
  return { paragraphIndex, sentenceIndex };
}
