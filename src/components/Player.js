import { useEffect, useRef } from 'react';

export default function Player({ song, isPlaying, onEnded }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const readyRef = useRef(false);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT || document.getElementById('yt-api-script')) return;
    const tag = document.createElement('script');
    tag.id = 'yt-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, []);

  // Init or reinit player when song changes
  useEffect(() => {
    if (!song) return;

    readyRef.current = false;

    const init = () => {
      // Destroy old player
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
        window.__moodifyPlayer = null;
      }

      // Create container div
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.id = 'yt-inner-player';
        containerRef.current.appendChild(div);
      }

      playerRef.current = new window.YT.Player('yt-inner-player', {
        videoId: song.videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady(e) {
            readyRef.current = true;
            window.__moodifyPlayer = e.target;
            e.target.playVideo();
          },
          onStateChange(e) {
            if (e.data === window.YT.PlayerState.ENDED) {
              onEnded?.();
            }
          },
          onError(e) {
            console.warn('YT player error:', e.data);
            onEnded?.(); // skip broken videos
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
    }
  }, [song?.videoId]);

  // Play / pause control
  useEffect(() => {
    const player = window.__moodifyPlayer;
    if (!player || !readyRef.current) return;
    try {
      isPlaying ? player.playVideo() : player.pauseVideo();
    } catch (_) {}
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', bottom: -1, left: -1, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  );
}