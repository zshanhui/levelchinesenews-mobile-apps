import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AUDIO_PLAY_LOAD_TIMEOUT_MS } from './constants';

/** Avoid crashing when the native player was already released between renders. */
function safePause(player: AudioPlayer | null | undefined) {
  if (!player) return;
  try {
    player.pause();
  } catch {
    // Player released by expo-audio lifecycle — ignore.
  }
}

function safeReplace(player: AudioPlayer | null | undefined, url: string) {
  if (!player) return;
  try {
    player.replace(url);
  } catch {
    // ignore
  }
}

function safePlay(player: AudioPlayer | null | undefined) {
  if (!player) return;
  try {
    player.play();
  } catch {
    // ignore
  }
}

/**
 * Single shared MP3 player for sentence audio in the article reader.
 *
 * Call `play(sentenceKey, resolvedUrl)` with an absolute URL from `resolveAudioUrl`.
 * Tapping the same sentence while playing or loading stops playback.
 */
export function useSentenceAudioPlayer() {
  const player = useAudioPlayer(null);
  const playerRef = useRef(player);
  playerRef.current = player;

  const status = useAudioPlayerStatus(player);

  const [playingSentenceKey, setPlayingSentenceKey] = useState<string | null>(null);
  const [loadingSentenceKey, setLoadingSentenceKey] = useState<string | null>(null);
  const [errorSentenceKey, setErrorSentenceKey] = useState<string | null>(null);

  const pendingSentenceKeyRef = useRef<string | null>(null);
  const playGenerationRef = useRef(0);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const clearActiveSentence = useCallback(() => {
    pendingSentenceKeyRef.current = null;
    setPlayingSentenceKey(null);
    setLoadingSentenceKey(null);
  }, []);

  const stop = useCallback(() => {
    playGenerationRef.current += 1;
    safePause(playerRef.current);
    clearActiveSentence();
  }, [clearActiveSentence]);

  const failSentence = useCallback(
    (sentenceKey: string) => {
      if (pendingSentenceKeyRef.current !== sentenceKey) return;
      setErrorSentenceKey(sentenceKey);
      clearActiveSentence();
      safePause(playerRef.current);
    },
    [clearActiveSentence],
  );

  useEffect(() => {
    const pending = pendingSentenceKeyRef.current;
    if (!pending) return;
    if (status.playing) {
      setPlayingSentenceKey(pending);
      setLoadingSentenceKey(null);
      setErrorSentenceKey((prev) => (prev === pending ? null : prev));
    }
  }, [status.playing]);

  useEffect(() => {
    if (status.didJustFinish) {
      clearActiveSentence();
    }
  }, [status.didJustFinish, clearActiveSentence]);

  useEffect(() => {
    if (!loadingSentenceKey) return;

    const sentenceKey = loadingSentenceKey;
    const generation = playGenerationRef.current;
    const timeoutId = setTimeout(() => {
      if (playGenerationRef.current !== generation) return;
      if (pendingSentenceKeyRef.current !== sentenceKey) return;
      failSentence(sentenceKey);
    }, AUDIO_PLAY_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [loadingSentenceKey, failSentence]);

  const play = useCallback(
    (sentenceKey: string, resolvedUrl: string) => {
      const url = resolvedUrl.trim();
      if (!url) {
        setErrorSentenceKey(sentenceKey);
        return;
      }

      const isSameSentenceActive =
        pendingSentenceKeyRef.current === sentenceKey &&
        (status.playing || status.isBuffering || loadingSentenceKey === sentenceKey);

      if (isSameSentenceActive) {
        stop();
        return;
      }

      playGenerationRef.current += 1;
      pendingSentenceKeyRef.current = sentenceKey;
      setErrorSentenceKey((prev) => (prev === sentenceKey ? null : prev));
      setLoadingSentenceKey(sentenceKey);
      setPlayingSentenceKey(null);

      const activePlayer = playerRef.current;
      safePause(activePlayer);
      safeReplace(activePlayer, url);
      safePlay(activePlayer);
    },
    [status.playing, status.isBuffering, loadingSentenceKey, stop],
  );

  return {
    playingSentenceKey,
    loadingSentenceKey,
    errorSentenceKey,
    play,
    stop,
  };
}
