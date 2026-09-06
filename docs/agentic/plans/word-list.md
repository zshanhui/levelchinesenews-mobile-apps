# On-device saved words

Local study list for words tapped in the article reader. **No backend API.** Persistence is SQLite on device, same database as the popup dictionary and “my articles” (`lcnlocal` in the React Native app). **Web is out of scope.**

This doc is the **data model** plus the first Word List UI (word + pinyin). Reader highlighting of studying vs learned is later.

## Product rules

- A saved word is either **studying** or **learned**. Status is per unique word, not per example. Examples belong to that word.
- Every word has **at least one sentence** (stored when the word is first created).
- Saving or marking learned from the reader stores that sentence as an example.
- **Studying → learned.** **Learned → studying**, or **removed**.
- Learned stays learned. There is no UI to save / add a learned word again.
- Once a word is in the list, the UI only allows **remove** or **studying → learned** (and later learned → studying). No second save, no duplicate occurrence.
- Removing the last example deletes the word.
- Reader UI will later treat studying vs learned words differently (not in this slice).

Existing UI already in the app (stubs, not persisted yet):

- Learn tab → **Word List** (`/learn/word-list`) — empty copy only.
- Article reader dictionary panel → **save word** / **mark learned** (`WordActionPanel`).

## Model: word + examples

```
user_saved_words          1 ──<  user_saved_word_examples
(unique word + status + pinyin)  (sentence snapshot; ≥1 per word)
```

v1 reader creates **one example** at first save or first mark-learned. Extra examples are allowed in the schema for later; v1 UI will not add them.

### `user_saved_words`

One row per distinct surface string as tapped in the article (`WordSegment.t`).


| Column       | Type                 | Notes                                              |
| ------------ | -------------------- | -------------------------------------------------- |
| `id`         | TEXT PK              | UUID                                               |
| `word`       | TEXT NOT NULL UNIQUE | Exact tap text. No simplified/traditional folding. |
| `pinyin`     | TEXT                 | Snapshot of `WordSegment.p` on first create. Word List display. |
| `status`     | TEXT NOT NULL        | `'studying'` \| `'learned'`                        |
| `created_at` | INTEGER              | Unix ms, first save or first mark-learned          |
| `updated_at` | INTEGER              | Unix ms, last status change                        |


Index: `word` (reader batch lookup), `status` (list filters later), `created_at DESC` (Word List).

Do not change `pinyin` after insert.

### `user_saved_word_examples`

One row per stored sentence. Text is **copied at create time** so the list still has context if the article is gone from cache. v1 Word List does not render these rows.


| Column          | Type          | Notes                                        |
| --------------- | ------------- | -------------------------------------------- |
| `id`            | TEXT PK       | UUID                                         |
| `word_id`       | TEXT NOT NULL | FK → `user_saved_words.id` ON DELETE CASCADE |
| `article_id`    | TEXT NOT NULL | For jump-to-article later                    |
| `pidx`          | INTEGER NOT NULL | Paragraph index (`sentenceKey` / `wordKey`) |
| `sidx`          | INTEGER NOT NULL | Sentence index (`sentenceKey` / `wordKey`)  |
| `widx`          | INTEGER NOT NULL | Word index (`wordKey` `p:s:w`)              |
| `sentence_text` | TEXT NOT NULL | Snapshot of `Sentence.f`                     |
| `created_at`    | INTEGER       | Unix ms                                      |


Unique: `(article_id, pidx, sidx, widx)` (defense in depth; v1 UI will not hit this).

Index: `word_id`.

Do **not** store CEDICT definitions. The local dict remains the source for meanings. No `article_title` in v1.

Insert the word row and its first example in **one transaction**. Never persist a word with zero examples.

## Identity

- **Word identity** = exact `word` string. `中国` and `中國` are different rows.
- **Example identity** = `article_id` + `pidx` + `sidx` + `widx`.
- v1: at most one example per word, created with the word.

Reader highlighting (later) matches `WordSegment.t` against `user_saved_words.word`.

## Status machine (v1 UI)

```
(not saved)
    │ save word      → studying + 1 example (pinyin + sentence from this tap)
    │ mark learned   → learned  + 1 example
    ▼
studying
    │ mark learned   → learned  (no new example)
    │ remove word    → delete word + examples
    ▼
learned
    │ switch to studying → studying
    │ remove             → delete word + examples
    ✗ save / add again   → not offered; keep learned
```

`mark learned` from the reader on an unsaved word does **not** require save-as-studying first.

## Operations (app layer)

New module next to `lib/savedArticlesDb.ts`, e.g. `lib/savedWordsDb.ts`. Schema via `runMigrations` in `lib/localDatabase.ts` (`PRAGMA user_version` 4 → **5**). Native only.


| Op                                  | Behavior |
| ----------------------------------- | -------- |
| `saveWord(occurrence)`              | If `word` exists, no-op. Else insert `studying` + example in one transaction. |
| `markLearned(occurrence)`           | If missing, insert `learned` + example. If `studying`, set `learned`. If already `learned`, no-op. |
| `setWordStatus(wordId, studying \| learned)` | Update status + `updated_at`. |
| `removeWord(wordId)`                | Delete word (CASCADE examples). |
| `removeExample(exampleId)`          | Delete example. If it was the last one, delete the word too. |
| `listWords({ status? })`            | `word`, `pinyin`, `status`; `ORDER BY created_at DESC`. |
| `getWordStatusMap(words: string[])` | For the reader later: `Map<word, status>`. |


Wire `WordActionPanel` from the article screen with current `word`, `pinyin`, `wordKey`, `sentenceKey`, `article.id`, and sentence full text. Hide or no-op Save when the word is already saved.

## Word List UI

- Empty: keep “Save words when reading articles to see them here”.
- Rows: **word + pinyin** only (not sentences).
- Order: **newest first** (`created_at DESC`). Marking learned does not reorder (`updated_at` is unused for sort).

## Out of scope

- Web.
- Backend sync, accounts, export/backup.
- Reader visual treatment of studying vs learned.
- Showing examples / sentences in the Word List, filters, search, SRS.
- Saving stopwords / latin segments (same as today’s popup).

## Persistence across app updates

Saved words live in the same on-device file as “my articles”: SQLite database **`lcnlocal`** (`expo-sqlite` default directory, app sandbox). They are **not** tied to the JS bundle.

**What keeps data**

- App Store / Play **version** updates (same `bundleIdentifier` / `package`): the sandbox is left in place. Opening the new binary runs `runMigrations` on the existing file.
- EAS Update / OTA JS-only updates: native files are untouched.
- Dictionary download / reset: already `DROP TABLE lcndict` only. Saved words and examples must stay out of that path.

**What wipes data (accepted, no cloud sync in v1)**

- Uninstall, Android “clear storage”, or a new install with a **different** bundle/package id (including Expo Go → standalone).
- Device backup restore is OS-dependent (iCloud / Android Auto Backup of the app container). We do not add our own export in v1.

**Rules so we do not delete this by accident**

1. **Additive migrations only.** Version 5 is `CREATE TABLE IF NOT EXISTS` + indexes, then `PRAGMA user_version = 5`. Never `DROP` / recreate `user_saved_words` or `user_saved_word_examples`. Never `deleteDatabaseAsync('lcnlocal')`.
2. **Do not rename** `LOCAL_DATABASE_NAME` (`lcnlocal`) without an explicit copy-forward. A new name is an empty database.
3. **Dict reset stays table-scoped.** `dropLcnDictTable` / `resetLocalDict` must never close-and-delete the whole file.
4. **Forward-only `user_version`.** Create tables successfully *before* bumping the pragma. Do not reuse or skip version numbers with destructive rebuilds.
5. Schema changes later = `ALTER TABLE … ADD COLUMN` (or a new table), not “drop and recreate.”

Part 1 tests should cover: open DB at version 4, run migrations, existing `user_saved_articles` rows still present.

## Scale (10k+ words)

SQLite on device already holds CEDICT (`lcndict`) at a much larger size. **10k words + 10k examples is well inside the storage and query budget.** Tens of thousands still are. The risk is the JS list UI, not the two tables.

| Path | At 10k | What to do |
| --- | --- | --- |
| `saveWord` / `markLearned` / lookup by `word` | Fine | Unique + index on `word` (already planned). |
| `listWords` | Fine if the SELECT is only `word`, `pinyin`, `status` | Do **not** join examples or pull `sentence_text` into the list. |
| Word List render | Fine with a virtualized list | Use `FlashList` (same as the article body). Do not `ScrollView` + `.map`. |
| Reader `getWordStatusMap` (later) | Fine | Load `word → status` once into a JS `Map` (~10k small strings) and invalidate on writes. Do not query per tap. |

v1 does **not** need list pagination, FTS, or a cache layer. Revisit if the bank is routinely 50k+ *and* the list feels slow; even then prefer FlashList + a covering index on `(created_at DESC)` before paging.

Sentence snapshots are the only bulky column. They stay on the examples table and off the Word List query, so they do not grow list memory.

## Implementation plan

Three parts, each shippable on its own. Do not start reader highlighting (out of scope).

### Part 1 — Persistence

Schema and data access only. No UI wiring.

- Migration `PRAGMA user_version` 4 → 5 in `lib/localDatabase.ts`: create `user_saved_words` and `user_saved_word_examples` (FK CASCADE, unique occurrence, indexes as above).
- New `lib/savedWordsDb.ts` (mirror `savedArticlesDb.ts`): `saveWord`, `markLearned`, `setWordStatus`, `removeWord`, `removeExample`, `listWords`, `getWordStatusMap`. Word + first example in one transaction. `saveWord` no-op if the word exists; `markLearned` no-op if already learned.
- Tests (`lib/savedWordsDb.test.ts`): first save; duplicate save no-op; mark learned on new vs studying vs learned; last example delete removes the word; `listWords` order is `created_at DESC`.

**Done when:** tests pass against the mocked SQLite helpers; app behavior unchanged.

### Part 2 — Save from the reader

Wire the existing dictionary action panel so taps persist.

- Pass occurrence context into `WordDictionaryPanel` / `WordActionPanel`: `word`, `pinyin`, `articleId`, parsed `pidx`/`sidx`/`widx`, `sentence_text`.
- `onSaveWord` → `saveWord`; `onMarkLearned` → `markLearned`. Toast on success (reuse bookmark toast pattern).
- If the word is already saved: do not offer Save. Studying: still offer mark learned. Learned: neither save nor mark learned (or mark learned is a no-op).
- Keep stopwords / latin segments ineligible, same as today’s popup.

**Done when:** saving a word in an article, then killing and reopening the app, the row is still in SQLite; tapping Save again on that word does nothing new.

### Part 3 — Word List screen

Show and manage the list. Still no reader highlighting.

- `app/learn/word-list.tsx`: `listWords()` on focus; empty state unchanged when count is 0.
- Each row: word + pinyin, newest first. Use `FlashList` (not `ScrollView` + map) so 10k+ rows stay cheap.
- Studying vs learned can be a small status affordance so the user can mark learned / switch back / remove (those transitions have no other home).
- Pull-to-refresh optional; reload on screen focus is enough.

**Done when:** save in the reader → word appears at the top of Word List; remove from the list → gone from SQLite and the empty state returns if it was the last word.

## Decisions (locked)

1. Status is per unique word; examples belong to that word.
2. Word List shows word + pinyin, `created_at DESC`.
3. Learned stays learned; no UI to add a learned word again.
4. Removing the last example removes the word.
5. Duplicate save of an already-saved word is not a UI path (remove or studying → learned only).
6. A word always has at least one sentence.
7. Web is out of scope.
