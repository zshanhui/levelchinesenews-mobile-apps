# Share links and App Links

How article sharing works across the native app and the web reader at [reader.levelchinese.app](https://reader.levelchinese.app).

## Goal

Users can share an article with a single HTTPS URL. Recipients open the link in a browser and read on the web reader. If they have the Android APK installed, the link should eventually open the native app instead.

We intentionally share **web URLs**, not `lcn://` custom-scheme links, so the link works for everyone (including people without the app).

## End-to-end flow

```
Native app: user taps globe share button
  → system share sheet emits https://reader.levelchinese.app/article/{id}

Recipient taps link
  → [future: web reader loads, may try lcn:// redirect if app installed]
  → [when verified: Android App Links open app directly from HTTPS]

App receives link
  → Expo Router navigates to app/article/[id].tsx
```

## Implemented in this repo (native app)

### Share button

| Item | Detail |
|------|--------|
| Component | `lib/components/ShareLinkButton.tsx` |
| Placement | Article detail meta row (`app/article/[id].tsx`), right-aligned beside source / published date |
| Icon | `globe-outline` (24px) |
| Action | React Native `Share.share()` — system share sheet, no social SDKs |

**Shared URL format:**

```
https://reader.levelchinese.app/article/{articleId}
```

Built by `buildArticleShareUrl()` in `lib/constants.ts` (`READER_WEB_BASE_URL`).

Platform behaviour:

- **Android** — `message` is the URL (what most apps copy/share).
- **iOS** — `url` is the URL; article title passed as `message` when available.

i18n key: `shareArticle` (accessibility label).

### Android App Links

Declared in `app.json` under `android.intentFilters`:

| Field | Value |
|-------|--------|
| Scheme | `https` |
| Host | `reader.levelchinese.app` |
| Path prefix | `/article` |
| `autoVerify` | `true` |
| Package | `com.wuweilabs.levelchinesenews` |

Expo Router HTTPS prefix in `app.config.js`:

```js
['expo-router', { origin: 'https://reader.levelchinese.app' }]
```

This maps incoming `https://reader.levelchinese.app/article/{id}` to the file route `app/article/[id].tsx`.

**Important:** `READER_WEB_BASE_URL`, `app.json` intent filter host, and `app.config.js` `origin` must stay in sync.

### Custom scheme (pre-existing)

`app.json` sets `"scheme": "lcn"`. Used for in-app flows (e.g. Pleco return via `lcn://article/{id}?word=...` in `lib/components/SentenceStudyPanel.tsx`).

Custom scheme deep links do **not** require `assetlinks.json`. They only work when the app is already installed.

### What we did not add

- iOS Universal Links (`associatedDomains` + `apple-app-site-association`) — Android-focused for now.
- Web reader redirect logic — lives in the separate web reader repo/branch.
- `assetlinks.json` hosting — web repo responsibility (see below).

## Rebuild required

`intentFilters` are compiled into the Android manifest at build time. After this config, ship a **new EAS/APK build** for App Links to take effect on devices.

## Testing (Android)

**Custom scheme (works without `assetlinks.json`):**

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "lcn://article/YOUR_ARTICLE_ID" \
  com.wuweilabs.levelchinesenews
```

**HTTPS App Link (after `assetlinks.json` is live and app reinstalled):**

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://reader.levelchinese.app/article/YOUR_ARTICLE_ID" \
  com.wuweilabs.levelchinesenews
```

**Check verification status:**

```bash
adb shell pm get-app-links com.wuweilabs.levelchinesenews
```

Look for `reader.levelchinese.app` with state `verified`.

## Left to do — web reader repo

The web reader is hosted separately (not in this repo). These items complete the web-first → app handoff.

### 1. Host `assetlinks.json` (required for verified App Links)

Serve at:

```
https://reader.levelchinese.app/.well-known/assetlinks.json
```

Requirements:

- HTTPS, no redirects on `/.well-known/`
- `Content-Type: application/json`

Example structure:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.wuweilabs.levelchinesenews",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:..."
      ]
    }
  }
]
```

Get the release signing certificate SHA-256 fingerprint from EAS:

```bash
eas credentials -p android
```

Use the fingerprint for the keystore that signs production/preview APKs users install. Debug and release fingerprints differ — include the one that matches shipped builds.

After publishing `assetlinks.json`, users must **install or update** the APK so Android re-runs domain verification.

### 2. Browser → app redirect (optional but recommended)

On the web reader article page (`/article/{id}`), add a one-time attempt to open the native app when the user is on Android and the app may be installed.

**Option A — Android Intent URL (web-first):**

```text
intent://article/{id}#Intent;scheme=lcn;package=com.wuweilabs.levelchinesenews;end
```

- Load the web reader first (user can read immediately).
- Try the intent once per session (`sessionStorage` guard) to avoid redirect loops.
- If the app is not installed, the user stays on the web reader.
- Do **not** set `S.browser_fallback_url` to the same article URL (causes reload loops).

**Option B — rely on App Links only**

Once `assetlinks.json` is verified, tapping the HTTPS link from external apps (Gmail, Messages, etc.) may open the app directly without browser JavaScript. In-app browsers and some chat apps may still need Option A as a fallback.

### 3. Web reader article route

Ensure `/article/{id}` works as the canonical share target (already the URL shape we emit). No path changes without updating `pathPrefix` in this repo’s `app.json`.

### 4. Optional UX on web

- Persistent **“Open in app”** button (same intent / `lcn://` target).
- Play Store / APK download link when the app is not installed.

## URL reference

| URL | Purpose |
|-----|---------|
| `https://reader.levelchinese.app/article/{id}` | Share link (public, web fallback) |
| `lcn://article/{id}` | Native deep link (app must be installed) |
| `lcn://article/{id}?word=...&wordKey=...&sentenceKey=...` | Pleco dictionary return (existing) |

## Related files (this repo)

| File | Role |
|------|------|
| `lib/components/ShareLinkButton.tsx` | Share UI and `Share.share()` |
| `lib/constants.ts` | `READER_WEB_BASE_URL`, `buildArticleShareUrl()` |
| `app/article/[id].tsx` | Meta row placement |
| `app.json` | `scheme: lcn`, Android `intentFilters` |
| `app.config.js` | Expo Router `origin` for HTTPS routing |
| `lib/i18n/translations.ts` | `shareArticle` label |

## Before vs after `assetlinks.json`

| Scenario | Before `assetlinks.json` | After verified |
|----------|--------------------------|----------------|
| Share HTTPS link, app not installed | Web reader in browser | Web reader in browser |
| Share HTTPS link, app installed | Browser (or disambiguation dialog) | App opens directly (App Links) |
| Share HTTPS link, in-app browser | Web reader; optional JS redirect to `lcn://` | Same; App Links may not apply in all WebViews |
| `lcn://` link, app installed | App opens | App opens |
