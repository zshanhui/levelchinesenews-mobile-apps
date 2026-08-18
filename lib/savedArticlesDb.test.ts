import { computeSentenceBookmarkDisplay } from './savedArticlesDb';
import type { ParsedParagraph } from './types';

describe('computeSentenceBookmarkDisplay', () => {
  it('returns null when parsed content is missing or empty', () => {
    expect(computeSentenceBookmarkDisplay(undefined, 0, 0)).toBeNull();
    expect(computeSentenceBookmarkDisplay(null, 0, 0)).toBeNull();
    expect(computeSentenceBookmarkDisplay([], 0, 0)).toBeNull();
  });

  it('returns null when there are no sentences in total', () => {
    const parsed = [{ s: [] }, { s: [] }] as ParsedParagraph[];
    expect(computeSentenceBookmarkDisplay(parsed, 0, 0)).toBeNull();
  });

  it('returns 1-based sentence index and total for valid target', () => {
    const parsed: ParsedParagraph[] = [
      { s: [{ f: 'p0s0', w: [] }, { f: 'p0s1', w: [] }] },
      { s: [{ f: 'p1s0', w: [] }] },
      { s: [{ f: 'p2s0', w: [] }, { f: 'p2s1', w: [] }] },
    ];

    expect(computeSentenceBookmarkDisplay(parsed, 0, 0)).toEqual({ n: 1, t: 5 });
    expect(computeSentenceBookmarkDisplay(parsed, 0, 1)).toEqual({ n: 2, t: 5 });
    expect(computeSentenceBookmarkDisplay(parsed, 1, 0)).toEqual({ n: 3, t: 5 });
    expect(computeSentenceBookmarkDisplay(parsed, 2, 1)).toEqual({ n: 5, t: 5 });
  });

  it('returns null for out-of-range or negative indices', () => {
    const parsed: ParsedParagraph[] = [
      { s: [{ f: 'p0s0', w: [] }] },
      { s: [{ f: 'p1s0', w: [] }] },
    ];

    expect(computeSentenceBookmarkDisplay(parsed, -1, 0)).toBeNull();
    expect(computeSentenceBookmarkDisplay(parsed, 0, -1)).toBeNull();
    expect(computeSentenceBookmarkDisplay(parsed, 2, 0)).toBeNull();
    expect(computeSentenceBookmarkDisplay(parsed, 0, 99)).toBeNull();
  });
});
