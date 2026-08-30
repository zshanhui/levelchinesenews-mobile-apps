/**
 * In-memory learned-word surfaces for the article reader.
 * O(1) membership, same pattern as stopwords. Not persisted — reload from SQLite.
 */

let learnedSet: Set<string> = new Set();
let revision = 0;
let loadGeneration = 0;
const listeners = new Set<() => void>();

export function getLearnedWordsSet(): ReadonlySet<string> {
  return learnedSet;
}

/** Increments on each successful commit; use in FlashList extraData, not a joined string. */
export function getLearnedWordsRevision(): number {
  return revision;
}

export function subscribeLearnedWords(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Bump so an in-flight SELECT discards its result if a newer load started. */
export function beginLearnedWordsLoad(): number {
  loadGeneration += 1;
  return loadGeneration;
}

export function commitLearnedWords(
  words: Iterable<string>,
  generation: number,
): void {
  if (generation !== loadGeneration) return;
  learnedSet = new Set(words);
  revision += 1;
  for (const listener of listeners) listener();
}

/** Test helper. */
export function resetLearnedWordsCache(): void {
  learnedSet = new Set();
  revision = 0;
  loadGeneration = 0;
  listeners.clear();
}
