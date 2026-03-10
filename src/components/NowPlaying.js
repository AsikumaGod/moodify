import { useEffect, useRef, useState } from 'react';
import '../styles/NowPlaying.css';

const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function NowPlaying({ song, mood, isPlaying, onPlayPause, onNext, onPrev }) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  // Poll player progress every 500ms
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      const player = window.__moodifyPlayer;
      if (!player) return;
      try {
        const cur = player.getCurrentTime?.() ?? 0;
        const dur = player.getDuration?.() ?? 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      } catch (_) {}
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, song]);

  // Reset on song change
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [song?.videoId]);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const player = window.__moodifyPlayer;
    if (player && duration) {
      player.seekTo(pct * duration, true);
      setProgress(pct * 100);
      setCurrentTime(pct * duration);
    }
  };

  return (
    <div
      className="now-playing"
      style={{
        background: `${mood.color}0F`,
        border: `1px solid ${mood.color}30`,
      }}
    >
      {/* Song info */}
      <div className="np-top">
        <img className="np-thumb" src={song.thumbnail} alt={song.title} />
        <div className="np-info">
          <p className="np-label">Now Playing</p>
          <p className="np-title">{song.title}</p>
          <p className="np-artist">{song.artist}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="np-progress-wrap" onClick={handleSeek}>
        <div className="np-progress-track">
          <div
            className="np-progress-fill"
            style={{ width: `${progress}%`, background: mood.color }}
          />
          <div
            className="np-progress-dot"
            style={{ left: `${progress}%`, background: mood.color }}
          />
        </div>
        <div className="np-times">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="np-controls">
        <button className="np-btn" onClick={onPrev} title="Previous">⏮</button>

        <button
          className="np-btn np-btn-play"
          onClick={onPlayPause}
          style={{ background: mood.color }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button className="np-btn" onClick={onNext} title="Next">⏭</button>
      </div>
    </div>
  );
}