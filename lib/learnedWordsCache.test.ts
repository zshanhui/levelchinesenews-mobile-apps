import {
  beginLearnedWordsLoad,
  commitLearnedWords,
  getLearnedWordsRevision,
  getLearnedWordsSet,
  resetLearnedWordsCache,
  subscribeLearnedWords,
} from './learnedWordsCache';

beforeEach(() => {
  resetLearnedWordsCache();
});

describe('learnedWordsCache', () => {
  it('commits a new Set and bumps revision', () => {
    const gen = beginLearnedWordsLoad();
    const rev = getLearnedWordsRevision();
    commitLearnedWords(['中国', '学习'], gen);
    expect([...getLearnedWordsSet()]).toEqual(['中国', '学习']);
    expect(getLearnedWordsRevision()).toBe(rev + 1);
  });

  it('discards a stale load after a newer one starts', () => {
    const stale = beginLearnedWordsLoad();
    const fresh = beginLearnedWordsLoad();
    commitLearnedWords(['旧'], stale);
    expect(getLearnedWordsSet().size).toBe(0);
    commitLearnedWords(['新'], fresh);
    expect([...getLearnedWordsSet()]).toEqual(['新']);
  });

  it('notifies subscribers only on a successful commit', () => {
    const listener = jest.fn();
    const unsub = subscribeLearnedWords(listener);
    const stale = beginLearnedWordsLoad();
    const fresh = beginLearnedWordsLoad();
    commitLearnedWords(['旧'], stale);
    expect(listener).not.toHaveBeenCalled();
    commitLearnedWords(['新'], fresh);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    commitLearnedWords(['后'], beginLearnedWordsLoad());
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
