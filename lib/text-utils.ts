export function capitalizeFirstWord(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** Full Chinese sentence string from parsed content (`Sentence.f`). */
export function sentenceFullText(sentence: { f: string }): string {
  return sentence.f;
}

/** CJK Unified Ideographs (Extension A + URO). Matches `isChineseWord`. */
const CJK_IDEOGRAPH_RE = /[\u3400-\u9fff]/;

/** True when `text` contains at least one CJK ideograph. */
export function hasCjkIdeograph(text: string): boolean {
  return CJK_IDEOGRAPH_RE.test(text);
}

/** True when `text` is non-empty and only CJK Unified Ideographs (no Latin, digits, or punctuation). */
export function isChineseWord(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^[\u3400-\u9fff]+$/.test(trimmed);
}

export type HighlightSegment = { text: string; highlight: boolean };

/**
 * Split `text` into plain/highlight segments for an exact substring match of `word`.
 * Uses indexOf (no regex) so it stays cheap for short Chinese sentences.
 */
export function splitHighlightSegments(
  text: string,
  word: string,
): HighlightSegment[] {
  if (!word || !text.includes(word)) {
    return [{ text, highlight: false }];
  }

  const segments: HighlightSegment[] = [];
  let start = 0;
  let idx = text.indexOf(word, start);
  while (idx !== -1) {
    if (idx > start) {
      segments.push({ text: text.slice(start, idx), highlight: false });
    }
    segments.push({ text: word, highlight: true });
    start = idx + word.length;
    idx = text.indexOf(word, start);
  }
  if (start < text.length) {
    segments.push({ text: text.slice(start), highlight: false });
  }
  return segments;
}


