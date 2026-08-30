jest.mock('./localDatabase', () => ({
  getLocalDatabase: jest.fn(),
  userSavedWordsTableName: 'user_saved_words',
  userSavedWordExamplesTableName: 'user_saved_word_examples',
}));

import { getLearnedWordsSet, resetLearnedWordsCache } from './learnedWordsCache';
import { getLocalDatabase } from './localDatabase';
import {
  getFirstExampleSentence,
  getWordStatusMap,
  listLearnedSurfaces,
  listWords,
  markLearned,
  removeExample,
  removeWord,
  removeWordBySurface,
  saveWord,
  setWordStatus,
} from './savedWordsDb';

type WordRow = {
  id: string;
  word: string;
  pinyin: string | null;
  status: 'studying' | 'learned';
  created_at: number;
  updated_at: number;
};

type ExampleRow = {
  id: string;
  word_id: string;
  article_id: string;
  pidx: number;
  sidx: number;
  widx: number;
  sentence_text: string;
  created_at: number;
};

function bindParams(args: unknown[]): unknown[] {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args;
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function createMemoryDb() {
  const words: WordRow[] = [];
  const examples: ExampleRow[] = [];

  const db = {
    withTransactionAsync: async (fn: () => Promise<void>) => {
      const wordsSnap = words.map((w) => ({ ...w }));
      const examplesSnap = examples.map((e) => ({ ...e }));
      try {
        await fn();
      } catch (err) {
        words.splice(0, words.length, ...wordsSnap);
        examples.splice(0, examples.length, ...examplesSnap);
        throw err;
      }
    },
    getFirstAsync: async (sql: string, ...rest: unknown[]) => {
      const q = compact(sql);
      const params = bindParams(rest);
      if (q.includes(`FROM user_saved_words WHERE word =`)) {
        return words.find((w) => w.word === params[0]) ?? null;
      }
      if (q.includes(`FROM user_saved_word_examples WHERE id =`)) {
        const row = examples.find((e) => e.id === params[0]);
        return row ? { word_id: row.word_id } : null;
      }
      if (q.includes('SELECT article_id, pidx, sidx, widx, sentence_text') && q.includes('user_saved_word_examples')) {
        const matches = examples
          .filter((e) => e.word_id === params[0])
          .sort((a, b) => a.created_at - b.created_at);
        const first = matches[0];
        return first
          ? {
              article_id: first.article_id,
              pidx: first.pidx,
              sidx: first.sidx,
              widx: first.widx,
              sentence_text: first.sentence_text,
            }
          : null;
      }
      if (q.includes(`COUNT(*)`) && q.includes('user_saved_word_examples')) {
        const n = examples.filter((e) => e.word_id === params[0]).length;
        return { count: n };
      }
      return null;
    },
    getAllAsync: async (sql: string, ...rest: unknown[]) => {
      const q = compact(sql);
      const params = bindParams(rest);
      if (q.includes('WHERE word IN')) {
        const wanted = new Set(params as string[]);
        return words
          .filter((w) => wanted.has(w.word))
          .map((w) => ({ word: w.word, status: w.status }));
      }
      let rows = [...words];
      if (q.includes('WHERE status =')) {
        rows = rows.filter((w) => w.status === params[0]);
      }
      rows.sort((a, b) => b.updated_at - a.updated_at);
      return rows;
    },
    runAsync: async (sql: string, ...rest: unknown[]) => {
      const q = compact(sql);
      const params = bindParams(rest);
      if (q.startsWith('INSERT INTO user_saved_words')) {
        words.push({
          id: params[0] as string,
          word: params[1] as string,
          pinyin: (params[2] as string | null) ?? null,
          status: params[3] as WordRow['status'],
          created_at: params[4] as number,
          updated_at: params[5] as number,
        });
        return;
      }
      if (q.startsWith('INSERT INTO user_saved_word_examples')) {
        examples.push({
          id: params[0] as string,
          word_id: params[1] as string,
          article_id: params[2] as string,
          pidx: params[3] as number,
          sidx: params[4] as number,
          widx: params[5] as number,
          sentence_text: params[6] as string,
          created_at: params[7] as number,
        });
        return;
      }
      if (q.startsWith('UPDATE user_saved_words SET status')) {
        const row = words.find((w) => w.id === params[2]);
        if (row) {
          row.status = params[0] as WordRow['status'];
          row.updated_at = params[1] as number;
        }
        return;
      }
      if (q.startsWith('DELETE FROM user_saved_word_examples WHERE word_id')) {
        for (let i = examples.length - 1; i >= 0; i--) {
          if (examples[i]!.word_id === params[0]) examples.splice(i, 1);
        }
        return;
      }
      if (q.startsWith('DELETE FROM user_saved_word_examples WHERE id')) {
        const i = examples.findIndex((e) => e.id === params[0]);
        if (i >= 0) examples.splice(i, 1);
        return;
      }
      if (q.startsWith('DELETE FROM user_saved_words WHERE id')) {
        const i = words.findIndex((w) => w.id === params[0]);
        if (i >= 0) words.splice(i, 1);
      }
    },
  };

  return { db, words, examples };
}

const occ = (
  word: string,
  extra?: Partial<{
    pinyin: string | null;
    articleId: string;
    pidx: number;
    sidx: number;
    widx: number;
    sentenceText: string;
  }>,
) => ({
  word,
  pinyin: extra?.pinyin ?? 'pinyin',
  articleId: extra?.articleId ?? 'art-1',
  pidx: extra?.pidx ?? 0,
  sidx: extra?.sidx ?? 0,
  widx: extra?.widx ?? 0,
  sentenceText: extra?.sentenceText ?? '句子',
});

let memory: ReturnType<typeof createMemoryDb>;

beforeEach(() => {
  resetLearnedWordsCache();
  memory = createMemoryDb();
  (getLocalDatabase as jest.Mock).mockResolvedValue(memory.db);
});

describe('saveWord', () => {
  it('inserts studying word and one example', async () => {
    await saveWord(occ('中国', { pinyin: 'zhōngguó' }));
    const listed = await listWords();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      word: '中国',
      pinyin: 'zhōngguó',
      status: 'studying',
    });
    expect(memory.examples).toHaveLength(1);
    expect(memory.examples[0]?.sentence_text).toBe('句子');
  });

  it('no-ops on duplicate save of the same word', async () => {
    await saveWord(occ('中国', { sidx: 0 }));
    await saveWord(occ('中国', { sidx: 1, sentenceText: '另一句' }));
    expect(await listWords()).toHaveLength(1);
    expect(memory.examples).toHaveLength(1);
    expect(memory.examples[0]?.sentence_text).toBe('句子');
  });

  it('treats 中国 and 中國 as different words', async () => {
    await saveWord(occ('中国'));
    await saveWord(occ('中國', { articleId: 'art-2' }));
    expect(await listWords()).toHaveLength(2);
  });
});

describe('markLearned', () => {
  it('creates a learned word when missing', async () => {
    await markLearned(occ('学习'));
    const listed = await listWords();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.status).toBe('learned');
    expect(memory.examples).toHaveLength(1);
  });

  it('promotes studying to learned without adding an example', async () => {
    await saveWord(occ('学习'));
    await markLearned(occ('学习', { sidx: 3, sentenceText: '新句子' }));
    const listed = await listWords();
    expect(listed[0]?.status).toBe('learned');
    expect(memory.examples).toHaveLength(1);
    expect(memory.examples[0]?.sentence_text).toBe('句子');
  });

  it('no-ops when already learned', async () => {
    await markLearned(occ('学习'));
    const before = (await listWords())[0];
    await markLearned(occ('学习', { sidx: 2 }));
    const after = (await listWords())[0];
    expect(after?.status).toBe('learned');
    expect(after?.updatedAt).toBe(before?.updatedAt);
    expect(memory.examples).toHaveLength(1);
  });
});

describe('listWords', () => {
  it('returns newest updated_at first', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
    await saveWord(occ('先'));
    jest.setSystemTime(2_000);
    await saveWord(occ('后', { articleId: 'art-2' }));
    jest.useRealTimers();
    const listed = await listWords();
    expect(listed.map((w) => w.word)).toEqual(['后', '先']);
  });

  it('moves a word to the top after its status changes', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
    await saveWord(occ('旧'));
    jest.setSystemTime(2_000);
    await saveWord(occ('新', { articleId: 'art-2' }));
    jest.setSystemTime(3_000);
    const olderId = (await listWords()).find((w) => w.word === '旧')!.id;
    await setWordStatus(olderId, 'learned');
    jest.useRealTimers();
    expect((await listWords()).map((w) => w.word)).toEqual(['旧', '新']);
  });

  it('filters by status', async () => {
    await saveWord(occ('读'));
    await markLearned(occ('会', { articleId: 'art-2' }));
    expect((await listWords({ status: 'studying' })).map((w) => w.word)).toEqual([
      '读',
    ]);
    expect((await listWords({ status: 'learned' })).map((w) => w.word)).toEqual([
      '会',
    ]);
  });
});

describe('getFirstExampleSentence', () => {
  it('returns the stored sentence and article location for a word', async () => {
    await saveWord(
      occ('中国', {
        articleId: 'art-9',
        pidx: 1,
        sidx: 2,
        widx: 3,
        sentenceText: '我去过中国。',
      }),
    );
    const id = (await listWords())[0]!.id;
    expect(await getFirstExampleSentence(id)).toEqual({
      articleId: 'art-9',
      pidx: 1,
      sidx: 2,
      widx: 3,
      sentenceText: '我去过中国。',
    });
  });

  it('returns null when the word has no examples', async () => {
    expect(await getFirstExampleSentence('missing')).toBeNull();
  });
});

describe('removeWord / removeExample', () => {
  it('removeWordBySurface deletes by exact word text', async () => {
    await saveWord(occ('删'));
    await removeWordBySurface('删');
    expect(await listWords()).toEqual([]);
    expect(memory.examples).toEqual([]);
  });

  it('removeWord deletes the word and its examples', async () => {
    await saveWord(occ('删'));
    const id = (await listWords())[0]!.id;
    await removeWord(id);
    expect(await listWords()).toEqual([]);
    expect(memory.examples).toEqual([]);
  });

  it('removing the last example deletes the word', async () => {
    await saveWord(occ('末'));
    await removeExample(memory.examples[0]!.id);
    expect(await listWords()).toEqual([]);
    expect(memory.examples).toEqual([]);
  });
});

describe('setWordStatus', () => {
  it('switches learned back to studying', async () => {
    await markLearned(occ('词'));
    const id = (await listWords())[0]!.id;
    await setWordStatus(id, 'studying');
    expect((await listWords())[0]?.status).toBe('studying');
  });
});

describe('learned words hide cache', () => {
  it('listLearnedSurfaces returns only learned words', async () => {
    await saveWord(occ('读'));
    await markLearned(occ('会', { articleId: 'art-2' }));
    expect(await listLearnedSurfaces()).toEqual(['会']);
  });

  it('markLearned refreshes the in-memory Set', async () => {
    await markLearned(occ('学习'));
    expect(getLearnedWordsSet().has('学习')).toBe(true);
  });

  it('saveWord does not put studying words in the Set', async () => {
    await saveWord(occ('读'));
    expect(getLearnedWordsSet().has('读')).toBe(false);
  });

  it('setWordStatus studying removes the word from the Set', async () => {
    await markLearned(occ('词'));
    const id = (await listWords())[0]!.id;
    await setWordStatus(id, 'studying');
    expect(getLearnedWordsSet().has('词')).toBe(false);
  });

  it('removeWord drops the surface from the Set', async () => {
    await markLearned(occ('删'));
    const id = (await listWords())[0]!.id;
    await removeWord(id);
    expect(getLearnedWordsSet().has('删')).toBe(false);
  });
});

describe('getWordStatusMap', () => {
  it('returns statuses for requested words only', async () => {
    await saveWord(occ('甲'));
    await markLearned(occ('乙', { articleId: 'art-2' }));
    const map = await getWordStatusMap(['甲', '乙', '丙', '甲']);
    expect(map.get('甲')).toBe('studying');
    expect(map.get('乙')).toBe('learned');
    expect(map.has('丙')).toBe(false);
    expect(map.size).toBe(2);
  });

  it('returns empty map for no words', async () => {
    expect(await getWordStatusMap([])).toEqual(new Map());
  });
});
