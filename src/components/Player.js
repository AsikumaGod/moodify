/**
 * Player.js
 *
 * Invisible audio engine for Moodify.
 * Hosts a hidden 1x1px YouTube IFrame player.
 * Controlled via the YouTube IFrame API.
 */

import { useEffect, useRef } from 'react';

const YT_SCRIPT_URL    = 'https://www.youtube.com/iframe_api';
const YT_SCRIPT_ID     = 'yt-api-script';
const YT_PLAYER_DIV_ID = 'yt-inner-player';
const PLAYER_GLOBAL_KEY = '__moodifyPlayer';

export default function Player({ song, isPlaying, onEnded }) {
  const containerRef = useRef(null);
  const playerRef    = useRef(null);
  const isReadyRef   = useRef(false);

  // Store onEnded in a ref so the player effect never needs it as a dependency.
  // This prevents the player from being destroyed/recreated when the callback changes.
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

  // Create or recreate the player when the song changes
  useEffect(() => {
    if (!song) return;

    isReadyRef.current = false;

    const initPlayer = () => {
      // Destroy old player instance
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
        window[PLAYER_GLOBAL_KEY] = null;
      }

      // Recreate the target div YT.Player attaches to
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.id = YT_PLAYER_DIV_ID;
        containerRef.current.appendChild(div);
      }

      playerRef.current = new window.YT.Player(YT_PLAYER_DIV_ID, {
        videoId: song.videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady(event) {
            isReadyRef.current = true;
            window[PLAYER_GLOBAL_KEY] = event.target;
            event.target.playVideo();
          },
          onStateChange(event) {
            if (event.data === window.YT.PlayerState.ENDED) {
              // Use ref so this closure always calls the latest onEnded
              onEndedRef.current?.();
            }
          },
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
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existingCallback?.();
        initPlayer();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.videoId]); // Intentionally only re-run when video ID changes

  // Play or pause when isPlaying toggles
  useEffect(() => {
    const player = window[PLAYER_GLOBAL_KEY];
    if (!player || !isReadyRef.current) return;
    try {
      isPlaying ? player.playVideo() : player.pauseVideo();
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