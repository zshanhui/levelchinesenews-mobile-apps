# Audio Client V1 Plan

## Goal

Add sentence-level Mandarin audio to the mobile article reader in two phases.

Phase 1 focuses only on reading and playing existing cached audio:

- load cached article audio when the reader opens (`GET /api/v1/audio`)
- show per-sentence audio availability in the article body
- play cached MP3 URLs from the reader screen
- keep missing audio as a clear unavailable state

Phase 2 adds creation/generation:

- generate missing sentence audio on demand (`POST /api/v1/audio`)
- merge successful POST responses into the GET-shaped cache without refetching the article
- play newly generated audio after the POST succeeds

This plan assumes the backend routes documented in `lcn-read-service/docs/endpoints.md`:

- `GET /api/v1/audio?article_id={uuid}&voice_id={voice_id?}` is public and returns cached entries keyed by `paragraph_index:sentence_index`, then by `voice_id`.
- `POST /api/v1/audio` is admin-protected and should not be part of Phase 1.
- `audio_url` values can be relative paths like `/api/v1/audio/{uuid}.mp3`, so the client must resolve them against the read API base URL before playback.

## Existing Client Pattern To Mirror

Translations already have the right architecture for the read side:

- `lib/useArticleTranslations.ts` fetches the article-level GET cache once the article exists.
- `lib/components/ArticleContent.tsx` receives cache/loading props from `app/article/[id].tsx`, colors the sentence translate toggle when cached data exists, and shows selected-sentence state.
- `app/article/[id].tsx` refetches translations during pull-to-refresh and passes translation state into `ArticleContent`.

Audio Phase 1 should mirror the GET/cache/rendering parts of this model, but not the POST-on-miss behavior yet.

## Phase 1: Read Cached Audio

### Data Types

Add read-side audio API types to `lib/types.ts`.

Suggested shape:

```ts
export interface StoredAudioEntry {
  audio_url: string;
  source_text_hash: string;
  provider: string;
  content_type: string;
  created_at: string;
}

export interface ArticleAudioResponse {
  article_id: string;
  article_sentence: Record<string, Record<string, StoredAudioEntry>>;
  article_full: null;
}
```

Keep the nested `article_sentence[sentenceKey][voiceId]` structure aligned with the backend. That lets the client support more voices later without changing the cache model.

### API Helpers And Cache Hook

Create `lib/useArticleAudio.ts`, mirroring `useArticleTranslations.ts`.

Responsibilities:

- expose `articleAudio`, `voiceId`, `loading`, `error`, and `refetch`
- call `apiReadUrl('/audio', { article_id: articleId, voice_id: voiceId })`
- fetch only when `articleId` exists and the article has loaded
- clear state when disabled or article ID is missing
- use `ARTICLE_REQUEST_TIMEOUT_MS`
- convert errors with `getUserFriendlyErrorMessage`

Suggested helper functions:

- `DEFAULT_ARTICLE_AUDIO_VOICE_ID = 'lei-jun'` for Phase 1, matching the current backend default voice key
- `getCachedSentenceAudioEntry(articleAudio, voiceId, sentenceKey)` to find a cached entry
- `hasCachedSentenceAudio(articleAudio, voiceId, sentenceKey)` for UI color/state
- `resolveAudioUrl(audioUrl)` in `lib/api.ts`, similar to `resolveImageUrl`, because the backend can return relative `/api/v1/audio/*.mp3` paths

Open question for implementation: whether to fetch `GET /audio/voices` now or keep Phase 1 on a fixed default voice. For a smaller first client change, use a fixed default voice in Phase 1 and leave voice selection for a later phase.

### Playback

Add an Expo playback dependency before implementing the player UI.

Recommended first check:

- use `npx expo install expo-audio` for Expo SDK 54
- verify the current `expo-audio` API before coding, because older examples use `expo-av`

Create a small playback hook, for example `lib/useSentenceAudioPlayer.ts`.

Responsibilities:

- accept a resolved MP3 URL
- keep one active sentence at a time
- expose `playingSentenceKey`, `loadingSentenceKey`, `errorSentenceKey`, `play`, `stop`, and cleanup on unmount
- stop current audio when selecting another sentence, refreshing, or leaving the article screen
- handle replay taps: if the same sentence is playing, either stop or restart; pick one behavior and make it obvious in the UI
- report playback failures separately from GET/cache failures

Avoid downloading files for Phase 1 unless streaming proves unreliable. The backend URL already streams MP3s, and Phase 1 can rely on the platform audio cache.

### Article Screen Wiring

Update `app/article/[id].tsx` similarly to translations:

- call `useArticleAudio(id, Boolean(article))` next to `useArticleTranslations`
- include `await refetchArticleAudio()` in `onRefreshArticle`
- pass `articleAudio`, `audioVoiceId`, `articleAudioLoading`, and playback callbacks/state into `ArticleContent`
- when the reader unmounts or article ID changes, stop active playback

Keep the article screen as the owner of article-level data fetching. `ArticleContent` should stay focused on rendering rows and invoking callbacks/hooks for row-level actions.

### Article Content UI

Extend `ArticleContent` and `MemoArticleSentenceRow` with read-only audio props.

Suggested Phase 1 interaction:

- show an audio button only for the selected sentence, similar to the translate button
- show the button as enabled only when `getCachedSentenceAudioEntry(...)` returns an entry
- use a speaker icon (`volume-medium-outline`, `play-circle-outline`, or similar Ionicons icon)
- color the icon with `theme.error` or another accent when cached audio exists, matching how translation availability is signaled
- show a spinner when either GET audio is loading or this sentence is starting playback
- on press:
  - if cached audio exists, resolve `audio_url` and play
  - if cache misses, do not POST in Phase 1; show `audioUnavailable` or disable the control
  - if playback fails, show a compact per-sentence playback error

Layout needs care because translation already owns a bottom-right floating button. Prefer a tiny selected-sentence control cluster anchored near the sentence edge instead of adding another overlapping absolute button. Possible layout:

- keep bookmark at top-right
- replace the single bottom-right translate FAB with a horizontal mini action row containing audio and translate buttons
- reserve enough right/bottom space in the sentence row so controls do not cover wrapped Chinese text

Accessibility:

- add localized labels such as `playSentenceAudio`, `stopSentenceAudio`, and `audioUnavailable`
- set busy state/loader labels while loading or starting playback
- keep tap targets at least as comfortable as the current translate control

### Cached Audio Playback Flow

Create `lib/useSentenceAudioOnPress.ts` for Phase 1 read/play behavior.

Flow:

1. Parse `highlightedSentenceKey` into `paragraphIndex` and `sentenceIndex` only if needed for state validation.
2. Look up `getCachedSentenceAudioEntry(articleAudio, voiceId, sentenceKey)`.
3. If cached, resolve and play the URL.
4. If missing, return an unavailable state and do not call `POST /audio`.
5. Ignore stale async playback results when the selected sentence changes or the user closes the selection.

Unlike translations, audio does not need an expanded panel. It can be button-driven and should keep playback state per selected sentence.

### Error And Loading States

Use separate state for:

- `articleAudioLoading`: GET cache loading
- `playingAudioSentenceKey`: current playback
- `loadingAudioSentenceKey`: playback startup/loading
- `audioError`: selected sentence playback or unavailable error

Recommended UX:

- cache GET failure should not block the article; hide cached indicators and leave audio unavailable
- network/timeout should reuse `networkUnstableOrOff` or `requestTimedOut`
- playback failure should say the audio could not be played
- missing cache should say audio is not available yet, not that generation failed

Add i18n keys in `lib/i18n/translations.ts` for all visible labels/errors.

### Constants And Environment

Reuse:

- `EXPO_PUBLIC_API_URL` for GET and MP3 playback

No Phase 1 write env var is required. Do not use `EXPO_PUBLIC_API_WRITE_URL` or `EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY` until Phase 2.

### Tests

Add focused unit coverage where practical:

- `getCachedSentenceAudioEntry` returns null for missing voice/sentence and entry for hits
- `hasCachedSentenceAudio` reflects cache availability
- `resolveAudioUrl` leaves absolute URLs unchanged and prefixes relative `/api/v1/audio/*.mp3` with `EXPO_PUBLIC_API_URL`

Manual QA:

- open an article with existing cached audio; selected sentence shows cached audio state and plays immediately
- open an article/sentence with no audio; audio control is disabled or shows unavailable copy, with no POST request
- pull-to-refresh refetches both translations and cached audio
- rapidly tap multiple cached sentences; only the current sentence plays and stale playback state does not linger
- turn off network; GET failure does not break article rendering and playback errors are understandable
- test on iOS and Android, especially background/silent-switch behavior after selecting the playback module

### Phase 1 Implementation Order

1. Add read-side audio types, `resolveAudioUrl`, and pure cache helpers.
2. Add `useArticleAudio` GET cache hook.
3. Add the playback dependency and a small player hook.
4. Add `useSentenceAudioOnPress` for cache lookup and playback only.
5. Wire article screen state and refresh handling.
6. Update `ArticleContent` row props and selected-sentence UI controls.
7. Add i18n labels/errors.
8. Add helper tests and run manual QA on device/simulator.

## Phase 2: Generate Missing Audio

Phase 2 adds `POST /api/v1/audio` after cached playback is working.

### Data Types

Extend `lib/types.ts` with POST-side types:

```ts
export enum AudioKind {
  ArticleSentence = 'article_sentence',
}

export interface AudioResponse {
  kind: AudioKind;
  article_id: string;
  paragraph_index: number | null;
  sentence_index: number | null;
  voice_id: string;
  audio_url: string;
  cached: boolean;
  provider?: string | null;
}
```

Add `mergeAudioResponseIntoArticleAudio(prev, res)` to merge POST responses into the GET cache.

### POST Hook

Create `lib/useGenerateSentenceAudio.ts`, mirroring `useTranslateSentence.ts`.

Responsibilities:

- build `apiWriteUrl('/audio')`
- include `X-Admin-Key` from `envConfig.tempAdminAccessWriteKey` when present
- send:

```json
{
  "kind": "article_sentence",
  "article_id": "...",
  "paragraph_index": 0,
  "sentence_index": 0,
  "voice_id": "lei-jun",
  "force": false
}
```

- do not send source text; the backend resolves sentence text from `parsed_content`
- use a longer timeout than normal POSTs because TTS generation can be slow, for example `AUDIO_POST_TIMEOUT_MS = 45_000`
- serialize POSTs with a module-level lock, like translations, so repeated taps do not launch multiple TTS jobs
- classify/report failures with `captureTrackedException`, using tags like `feature: 'sentence_audio_post'` and `failure_kind: 'timeout' | 'network' | 'http' | 'other'`

Security note: `POST /audio` is admin-protected. The mobile app already sends a public Expo env admin key for protected write endpoints, but shipping audio generation to production with that same pattern should be intentional. If audio generation is meant for all users, consider a backend-safe user entitlement/rate-limit path before enabling POST in production builds.

### Phase 2 UI And Flow Changes

Update the Phase 1 press flow:

1. Parse `highlightedSentenceKey` into `paragraphIndex` and `sentenceIndex`.
2. Look up `getCachedSentenceAudioEntry(articleAudio, voiceId, sentenceKey)`.
3. If cached, resolve and play the URL.
4. If missing, POST `/audio` with `force: false`.
5. Merge the POST response into the article audio cache.
6. Resolve and play the returned URL.
7. Ignore stale async results when the selected sentence changes or the user closes the selection.

Additional state:

- `generatingAudioSentenceKey`: POST in flight

Additional UX:

- show a spinner when this sentence is generating
- POST `503` should show a user-friendly server unavailable message
- generation failure should be distinct from playback failure

Additional constants/env:

- add `AUDIO_POST_TIMEOUT_MS = 45_000` to `lib/constants.ts`
- reuse `EXPO_PUBLIC_API_WRITE_URL` for POST generation
- reuse `EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY` for `X-Admin-Key`, with the security caveat above

Additional tests:

- `mergeAudioResponseIntoArticleAudio` creates a GET-shaped cache from a POST response
- merge preserves other sentence keys and other voice IDs
- missing-cache press triggers POST, merges, then plays

