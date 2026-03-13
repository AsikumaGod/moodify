import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/NowPlaying.css';

const PLAYER_GLOBAL_KEY = '__moodifyPlayer';
const POLL_INTERVAL_MS = 500;

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function NowPlaying({ song, mood, isPlaying, onPlayPause, onNext, onPrev }) {
  const [progress, setProgress]       = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const intervalRef                   = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      const player = window[PLAYER_GLOBAL_KEY];
      if (!player) return;
      try {
        const cur = player.getCurrentTime?.() ?? 0;
        const dur = player.getDuration?.()   ?? 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      } catch (_) {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, song]);

  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [song?.videoId]);

  const handleSeek = (e) => {
    const rect     = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const player   = window[PLAYER_GLOBAL_KEY];
    if (player && duration) {
      player.seekTo(fraction * duration, true);
      setCurrentTime(fraction * duration);
      setProgress(fraction * 100);
    }
  };

  // Render into document.body via Portal — completely escapes any parent
  // stacking context created by backdrop-filter, transform, or will-change.
  return createPortal(
    <div className="now-playing" style={{ borderTop: `2px solid ${mood.color}60` }}>
      <div className="now-playing__inner">

        {/* Song info + controls */}
        <div className="np-top">
          <img className="np-thumb" src={song.thumbnail} alt="" />

          <div className="np-info">
            <p className="np-label">NOW PLAYING</p>
            <p className="np-title">{song.title}</p>
            <p className="np-artist">{song.artist}</p>
          </div>

          <div className="np-controls">
            <button className="np-btn" onClick={onPrev} aria-label="Previous">⏮</button>
            <button
              className="np-btn np-btn-play"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{ background: mood.color }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="np-btn" onClick={onNext} aria-label="Next">⏭</button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="np-progress-wrap"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="np-progress-track">
            <div className="np-progress-fill" style={{ width: `${progress}%`, background: mood.color }} />
            <div className="np-progress-dot"  style={{ left:  `${progress}%`, background: mood.color }} />
          </div>
          <div className="np-times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}