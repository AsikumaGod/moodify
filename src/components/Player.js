/**
 * Player.js
 *
 * Invisible audio engine for Moodify.
 *
 * Cross-browser autoplay strategy:
 *
 *   Chrome/Edge — autoplay generally allowed after user interaction with page.
 *
 *   iOS Safari  — playVideo() must be called within the same gesture stack
 *                 as the user's tap. Fixed via pendingPlayRef in onReady.
 *
 *   Firefox     — the strictest of all. Firefox requires the user to have
 *                 directly interacted with the DOCUMENT (not just the app)
 *                 before ANY audio can play. It fires error code 5 on every
 *                 autoplay attempt and also fires onError for videos it can't
 *                 play due to region/embed restrictions.
 *
 *                 Fix:
 *                   1. Detect Firefox via userAgent.
 *                   2. On error code 5 in Firefox, do NOT skip — instead set
 *                      a "blocked" flag and let the UI show a tap-to-play nudge.
 *                   3. Only skip on codes 100/101/150 (truly unplayable videos).
 *                   4. A document-level 'click' listener retries playVideo()
 *                      the moment Firefox grants permission via user gesture.
 */

import { useEffect, useRef } from 'react';

const YT_SCRIPT_URL     = 'https://www.youtube.com/iframe_api';
const YT_SCRIPT_ID      = 'yt-api-script';
const YT_PLAYER_DIV_ID  = 'yt-inner-player';
const PLAYER_GLOBAL_KEY = '__moodifyPlayer';

// Error codes that mean a video is genuinely unplayable — always skip these
const HARD_SKIP_CODES = new Set([100, 101, 150]);

// Detect Firefox once at module load
const IS_FIREFOX = typeof navigator !== 'undefined' &&
  navigator.userAgent.toLowerCase().includes('firefox');

export default function Player({ song, isPlaying, onEnded, onBlocked }) {
  const containerRef   = useRef(null);
  const playerRef      = useRef(null);
  const isReadyRef     = useRef(false);
  const pendingPlayRef = useRef(false);

  // Track whether Firefox's autoplay policy is blocking us
  const blockedRef     = useRef(false);

  // Cleanup handle for the document click listener
  const clickListenerRef = useRef(null);

  const onEndedRef  = useRef(onEnded);
  const onBlockedRef = useRef(onBlocked);
  useEffect(() => { onEndedRef.current  = onEnded;   }, [onEnded]);
  useEffect(() => { onBlockedRef.current = onBlocked; }, [onBlocked]);

  // Inject the YouTube IFrame API script once on mount
  useEffect(() => {
    if (!window.YT && !document.getElementById(YT_SCRIPT_ID)) {
      const tag = document.createElement('script');
      tag.id  = YT_SCRIPT_ID;
      tag.src = YT_SCRIPT_URL;
      document.body.appendChild(tag);
    }
  }, []);

  // Helper: attach a one-time document click listener to retry play on Firefox
  const attachClickRetry = () => {
    // Remove any existing listener first
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current);
    }

    const handler = () => {
      document.removeEventListener('click', clickListenerRef.current);
      clickListenerRef.current = null;
      blockedRef.current = false;
      onBlockedRef.current?.(false); // Tell UI to hide the nudge

      const player = window[PLAYER_GLOBAL_KEY];
      if (player && isReadyRef.current) {
        try { player.playVideo(); } catch (_) {}
      }
    };

    clickListenerRef.current = handler;
    document.addEventListener('click', handler, { once: true });
  };

  // Create or recreate the player whenever the song changes
  useEffect(() => {
    if (!song) return;

    isReadyRef.current    = false;
    pendingPlayRef.current = isPlaying;
    blockedRef.current    = false;

    // Remove any stale click retry listener from previous song
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current);
      clickListenerRef.current = null;
    }

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
        window[PLAYER_GLOBAL_KEY] = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.id = YT_PLAYER_DIV_ID;
        containerRef.current.appendChild(div);
      }

      playerRef.current = new window.YT.Player(YT_PLAYER_DIV_ID, {
        videoId: song.videoId,
        playerVars: {
          autoplay:    0,
          controls:    0,
          playsinline: 1,
          origin:      window.location.origin,
        },
        events: {
          onReady(event) {
            isReadyRef.current = true;
            window[PLAYER_GLOBAL_KEY] = event.target;

            if (pendingPlayRef.current) {
              try {
                event.target.playVideo();
              } catch (_) {}
              pendingPlayRef.current = false;
            }
          },

          onStateChange(event) {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current?.();
            }
          },

          onError(event) {
            const code = event.data;
            console.warn('YouTube player error:', code, IS_FIREFOX ? '(Firefox)' : '');

            // Always skip truly unplayable videos (removed, private, embed-blocked)
            if (HARD_SKIP_CODES.has(code)) {
              onEndedRef.current?.();
              return;
            }

            // Error 5 = HTML5 / autoplay policy blocked
            if (code === 5) {
              if (IS_FIREFOX) {
                // Firefox blocked autoplay — do NOT skip.
                // Instead signal the UI to show a "tap to play" nudge and
                // attach a document click listener to retry when user taps.
                blockedRef.current = true;
                onBlockedRef.current?.(true);
                attachClickRetry();
              } else {
                // Non-Firefox error 5 — retry once after short delay
                setTimeout(() => {
                  try {
                    const p = window[PLAYER_GLOBAL_KEY];
                    if (p) p.playVideo();
                  } catch (_) {}
                }, 800);
              }
              return;
            }

            // Any other error: skip
            onEndedRef.current?.();
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existingCallback?.();
        initPlayer();
      };
    }

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener('click', clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.videoId]);

  // Respond to play/pause toggles
  useEffect(() => {
    if (!isReadyRef.current) {
      pendingPlayRef.current = isPlaying;
      return;
    }

    const player = window[PLAYER_GLOBAL_KEY];
    if (!player) return;

    try {
      if (isPlaying) {
        player.playVideo();
        pendingPlayRef.current = false;
        // If user manually pressed play, that counts as a gesture — clear block
        if (blockedRef.current) {
          blockedRef.current = false;
          onBlockedRef.current?.(false);
          if (clickListenerRef.current) {
            document.removeEventListener('click', clickListenerRef.current);
            clickListenerRef.current = null;
          }
        }
      } else {
        player.pauseVideo();
      }
    } catch (_) {}
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed', bottom: -1, left: -1,
        width: 1, height: 1, opacity: 0, pointerEvents: 'none',
      }}
    />
  );
}