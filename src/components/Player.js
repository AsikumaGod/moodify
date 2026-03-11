/**
 * Player.js
 *
 * Invisible audio engine for Moodify.
 * Hosts a hidden 1x1px YouTube IFrame player controlled via the YouTube IFrame API.
 *
 * iOS Safari Autoplay Fix:
 *   iOS Safari blocks autoplay unless triggered by a direct user gesture (a tap).
 *   When the playlist loads after a mood click, the song is set in code — which
 *   iOS does not count as a user gesture, so it silently blocks playback.
 *
 *   The fix has two parts:
 *   1. On the FIRST load: skip autoplay in onReady. Instead, wait for the
 *      isPlaying effect to fire, which is triggered by the user's mood tap.
 *   2. In the isPlaying effect: if the player isn't ready yet, store a
 *      "pending play" flag so onReady can honour it once the iframe loads.
 *
 *   This chains the user's tap → state change → player play command cleanly,
 *   satisfying iOS's requirement that playback originates from a gesture.
 */

import { useEffect, useRef } from 'react';

const YT_SCRIPT_URL     = 'https://www.youtube.com/iframe_api';
const YT_SCRIPT_ID      = 'yt-api-script';
const YT_PLAYER_DIV_ID  = 'yt-inner-player';
const PLAYER_GLOBAL_KEY = '__moodifyPlayer';

export default function Player({ song, isPlaying, onEnded }) {
  const containerRef   = useRef(null);
  const playerRef      = useRef(null);
  const isReadyRef     = useRef(false);

  // Tracks whether play was requested before the player finished loading.
  // If true, onReady will call playVideo() to honour the deferred request.
  const pendingPlayRef = useRef(false);

  // Store onEnded in a ref so the player effect never needs it as a dependency.
  // Prevents the player from being destroyed/recreated when the callback identity changes.
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Inject the YouTube IFrame API script once on mount
  useEffect(() => {
    const alreadyLoaded = window.YT || document.getElementById(YT_SCRIPT_ID);
    if (!alreadyLoaded) {
      const tag = document.createElement('script');
      tag.id  = YT_SCRIPT_ID;
      tag.src = YT_SCRIPT_URL;
      document.body.appendChild(tag);
    }
  }, []);

  // Create or recreate the player whenever the song changes
  useEffect(() => {
    if (!song) return;

    // Reset ready state — player is not controllable until onReady fires
    isReadyRef.current   = false;

    // Carry over the current isPlaying intent as a pending request.
    // This is the key iOS fix: if isPlaying is already true when the new
    // player loads, onReady will see pendingPlayRef and call playVideo(),
    // which at that point is still within the same gesture call stack on iOS.
    pendingPlayRef.current = isPlaying;

    const initPlayer = () => {
      // Destroy previous player instance cleanly
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
        window[PLAYER_GLOBAL_KEY] = null;
      }

      // Recreate the target div that YT.Player replaces with an iframe
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.id = YT_PLAYER_DIV_ID;
        containerRef.current.appendChild(div);
      }

      playerRef.current = new window.YT.Player(YT_PLAYER_DIV_ID, {
        videoId: song.videoId,
        playerVars: {
          autoplay:    0, // Let our code control play — do NOT rely on autoplay
          controls:    0, // Hide native YouTube controls (we have our own UI)
          playsinline: 1, // Prevent fullscreen takeover on iOS
        },
        events: {
          /**
           * onReady fires once the iframe is loaded and accepts commands.
           * If a play was pending (user already tapped), honour it now.
           * This satisfies iOS's requirement that playVideo() is called
           * within the same event loop tick as the initiating user gesture.
           */
          onReady(event) {
            isReadyRef.current = true;
            window[PLAYER_GLOBAL_KEY] = event.target;

            if (pendingPlayRef.current) {
              event.target.playVideo();
              pendingPlayRef.current = false;
            }
          },

          /** Fires when the video ends — advance to next song */
          onStateChange(event) {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current?.();
            }
          },

          /** Fires on unplayable videos (region locked, removed, etc.) — skip */
          onError(event) {
            console.warn('YouTube player error code:', event.data);
            onEndedRef.current?.();
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // API script not yet loaded — defer until it fires the global callback
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existingCallback?.();
        initPlayer();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.videoId]); // Only re-run when the video changes, not on isPlaying changes

  /**
   * Effect: Respond to play/pause toggles after the player is ready.
   *
   * If the player isn't ready yet (still loading), store the intent in
   * pendingPlayRef so onReady can pick it up — this is the iOS fix path.
   */
  useEffect(() => {
    if (!isReadyRef.current) {
      // Player not ready yet — store intent for onReady to handle
      pendingPlayRef.current = isPlaying;
      return;
    }

    const player = window[PLAYER_GLOBAL_KEY];
    if (!player) return;

    try {
      isPlaying ? player.playVideo() : player.pauseVideo();
    } catch (_) {
      // Ignore errors during transient player state changes
    }
  }, [isPlaying]);

  // Invisible 1x1px container — the YouTube iframe lives inside it
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: -1,
        left: -1,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}