#!/usr/bin/env node
/**
 * Fetches full article detail responses from the API and writes them to seed-article-details.json.
 * Run with the API server running: cd lcn-read-service && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
 *
 * Usage: node scripts/fetch-article-details.js [apiBaseUrl]
 * Example: EXPO_PUBLIC_API_URL=https://api.example.com node scripts/fetch-article-details.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.EXPO_PUBLIC_API_URL || process.argv[2] || 'http://127.0.0.1:8000';
const API_PREFIX = '/api/v1';

const seedArticlesPath = path.join(__dirname, '../assets/seed-articles.json');
const seedDetailsPath = path.join(__dirname, '../assets/seed-article-details.json');

async function fetchArticle(id) {
  const url = `${API_BASE}${API_PREFIX}/articles/${id}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
  }
  return res.json();
}

async function main() {
  const seedArticles = JSON.parse(fs.readFileSync(seedArticlesPath, 'utf-8'));
  const ids = seedArticles.items.map((item) => item.id);

  console.log(`Fetching ${ids.length} articles from ${API_BASE}${API_PREFIX}/articles/{id}...`);

  const details = {};

  for (const id of ids) {
    try {
      const data = await fetchArticle(id);
      details[id] = data;
      console.log(`  ✓ ${id} ${data.title?.slice(0, 40)}...`);
    } catch (err) {
      console.error(`  ✗ ${id}: ${err.message}`);
    }
  }

  fs.writeFileSync(seedDetailsPath, JSON.stringify(details, null, 2), 'utf-8');
  console.log(`\nWrote ${Object.keys(details).length} article details to ${seedDetailsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
