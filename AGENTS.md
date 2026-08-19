# AGENTS.md

## Live Smoke Screen QA Testing

- **Test the production reader web app** at https://reader.levelchinese.app (hosted from the `main-web-reader` branch, currently v0.1.2). Do not use `pnpm web` on `main`: that layout shows `WebUnsupportedScreen` for all web. Do not deploy `main` to this host.
  - Article URLs: `https://reader.levelchinese.app/article/{uuid}`
  - Example articles that loaded in a live smoke test:
    - https://reader.levelchinese.app/article/c8fdf9b9-dba1-44c7-9d5b-3abe6543a343
    - https://reader.levelchinese.app/article/61e9879e-8e50-4080-a362-e0fdeca866d8?sentenceKey=0:0
  - For fresh IDs, `GET https://api-mig4242.levelchinese.app/api/v1/articles?page=1&page_size=3` (public). Wait 1–2s past the skeleton; article + `GET /api/v1/translations?article_id={id}&lang=en` should be HTTP 200, with title, hero image, segmented Chinese, and pinyin.
  - Expected on this build (not failures): `/` says the feed is unavailable on web; `/create` says URL parsing is native-only; word tap opens a popup that says the local dictionary is native-only; `/learn` is a 404; unknown article IDs show “Not found.” + Retry. Settings at `/settings` should fully render. `/.well-known/assetlinks.json` currently returns the SPA HTML shell, not JSON.

- **Build and deploy the Astro marketing site** in `lcnwebsite/` to Cloudflare Pages. Production is https://levelchinese.app (not the reader host). Needs Node `>=22.12.0` and Wrangler auth.
  - Deploy pages: `cd lcnwebsite && npm run page:dep` (`astro build` then `wrangler pages deploy dist --project-name=levelchineseapplanding`).
  - Contact-form Worker is separate: `npm run worker:dep` (only when `lcnwebsite/workers/` changed).
  - **After every deploy**, open the live production site in the browser (not `astro preview`, not curl). Always check:
    - Index: https://levelchinese.app
    - Sentence Examples: https://levelchinese.app/example-sentences (client-side search; wait for the page JS, then search a Chinese word such as `中国` and confirm result cards render)
    - Whatever was just deployed: load those pages/features on production and confirm they work, including images, links, and interactive bits
