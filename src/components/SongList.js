/**
 * SongList.js
 *
 * Renders the panel that appears after a mood is selected. Contains:
 *   - A header with the mood name and song count
 *   - A loading indicator while songs are being fetched
 *   - An error message if the fetch failed
 *   - The list of SongItem rows once data is ready
 *   - The NowPlaying controls when a song is active
 *
 * This component is purely presentational — it receives all data
 * and callbacks from App.js and passes them further down the tree.
 */

import SongItem from './SongItem';
import NowPlaying from './NowPlaying';
import '../styles/SongList.css';

/**
 * SongList component.
 *
 * @param {Object}        props
 * @param {Object}        props.mood        - Active mood (colors, label, emoji)
 * @param {Array}         props.songs       - Array of song objects to display
 * @param {boolean}       props.loading     - True while the API call is in progress
 * @param {string|null}   props.error       - Error message, or null if no error
 * @param {Object|null}   props.currentSong - Song currently loaded in the player
 * @param {boolean}       props.isPlaying   - Whether the player is playing
 * @param {Function}      props.onSelect    - Called with a song object when a row is clicked
 * @param {Function}      props.onPlayPause - Toggles play/pause
 * @param {Function}      props.onNext      - Skips to the next song
 * @param {Function}      props.onPrev      - Goes back to the previous song
 */
export default function SongList({
  mood,
  songs,
  loading,
  error,
  currentSong,
  isPlaying,
  onSelect,
  onPlayPause,
  onNext,
  onPrev,
}) {
  return (
    <div className="song-list">
      {/* ── Panel header ──────────────────────────────────── */}
      <div className="song-list-header">
        <p className="song-list-label">
          {mood.emoji} {mood.label} playlist
          {/* Show count once we have songs; pulse dots while still loading more */}
          {songs.length > 0 && (
            <span className="song-list-count">
              {songs.length} song{songs.length !== 1 ? 's' : ''}
              {loading && <span className="song-list-count__loading"> ···</span>}
            </span>
          )}
        </p>
        {/* Coloured accent line beneath the label */}
        <div className="song-list-bar" style={{ background: mood.color }} />
      </div>

      {/* ── Loading state ─────────────────────────────────── */}
      {loading && (
        <div className="song-list-state">
          <div className="song-list-state-icon">🎵</div>
          <p>Loading playlist...</p>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────── */}
      {error && (
        <div className="song-list-state error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── Song rows (only shown when not loading and no error) ── */}
      {!loading && !error && (
        <div className="song-list-items">
          {songs.map((song, index) => (
            <SongItem
              key={song.videoId} // videoId is unique and stable — ideal key
              song={song}
              index={index}
              isPlaying={currentSong?.videoId === song.videoId}
              mood={mood}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {/* ── Now Playing bar (shown once a song is selected) ── */}
      {currentSong && (
        <NowPlaying
          song={currentSong}
          mood={mood}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrev={onPrev}
        />
      )}
    </div>
  );
}