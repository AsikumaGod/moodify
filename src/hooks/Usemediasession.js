/**
 * useMediaSession.js
 *
 * Custom hook that integrates the Media Session API.
 *
 * What this enables:
 *   - Lock screen controls on iOS Safari, Chrome Android, Firefox mobile
 *   - Song title, artist and artwork on the lock screen / notification shade
 *   - Hardware media keys (play, pause, next, prev) on keyboards and headphones
 *   - Car display and AirPod controls
 *
 * Browser support:
 *   - Chrome Android  — full support
 *   - iOS Safari 15+  — full support
 *   - Firefox 82+     — full support
 *
 * Falls back silently on unsupported browsers.
 */

import { useEffect } from 'react';

export default function useMediaSession({
  song,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
}) {
  // Update lock screen metadata whenever the song changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  song.title,
      artist: song.artist,
      album:  'Moodify',
      artwork: song.thumbnail
        ? [{ src: song.thumbnail, sizes: '320x180', type: 'image/jpeg' }]
        : [],
    });
  }, [song]);

  // Keep OS playback state in sync (shows play vs pause icon on lock screen)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Register hardware/OS media control handlers
  // (lock screen buttons, AirPods, Bluetooth, keyboard media keys)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers = [
      ['play',          onPlay],
      ['pause',         onPause],
      ['nexttrack',     onNext],
      ['previoustrack', onPrev],
      ['stop', () => {
        onPause?.();
        navigator.mediaSession.playbackState = 'none';
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler ?? null);
      } catch (_) {
        // Not all browsers support every action — fail silently
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (_) {}
      }
    };
  }, [onPlay, onPause, onNext, onPrev]);
}