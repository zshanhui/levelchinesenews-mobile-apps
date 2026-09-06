jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

import {
  LOCAL_SCHEMA_VERSION,
  runMigrations,
  userSavedArticlesTableName,
  userSavedWordExamplesTableName,
  userSavedWordsTableName,
} from './localDatabase';

describe('runMigrations version 5', () => {
  it('adds saved-word tables without dropping existing user tables', async () => {
    const sqlChunks: string[] = [];
    const db = {
      getFirstAsync: jest.fn(async () => ({ user_version: 4 })),
      execAsync: jest.fn(async (sql: string) => {
        sqlChunks.push(sql);
      }),
    };

    await runMigrations(db as never);

    const all = sqlChunks.join('\n');
    expect(LOCAL_SCHEMA_VERSION).toBe(5);
    expect(all).toContain(`CREATE TABLE IF NOT EXISTS ${userSavedWordsTableName}`);
    expect(all).toContain(
      `CREATE TABLE IF NOT EXISTS ${userSavedWordExamplesTableName}`,
    );
    expect(all).toContain('ON DELETE CASCADE');
    expect(all).toContain('PRAGMA user_version = 5');
    expect(all).not.toMatch(new RegExp(`DROP TABLE.*${userSavedWordsTableName}`));
    expect(all).not.toMatch(
      new RegExp(`DROP TABLE.*${userSavedWordExamplesTableName}`),
    );
    expect(all).not.toMatch(
      new RegExp(`DROP TABLE.*${userSavedArticlesTableName}`),
    );
  });

  it('does not recreate word tables when already at version 5', async () => {
    const sqlChunks: string[] = [];
    const db = {
      getFirstAsync: jest.fn(async () => ({ user_version: 5 })),
      execAsync: jest.fn(async (sql: string) => {
        sqlChunks.push(sql);
      }),
    };

    await runMigrations(db as never);

    const all = sqlChunks.join('\n');
    expect(all).not.toContain('CREATE TABLE IF NOT EXISTS user_saved_words');
    expect(all).not.toContain('PRAGMA user_version = 5');
    expect(all).toContain('PRAGMA foreign_keys = ON');
  });
});
