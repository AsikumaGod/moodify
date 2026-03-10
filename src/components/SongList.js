import SongItem from './SongItem';
import NowPlaying from './NowPlaying';
import '../styles/SongList.css';

export default function SongList({
  mood, songs, loading, error,
  currentSong, isPlaying,
  onSelect, onPlayPause, onNext, onPrev,
}) {
  return (
    <div className="song-list" style={{ border: `1px solid ${mood.color}33` }}>

      {/* Header */}
      <div className="song-list-header">
        <p className="song-list-label">
          {mood.emoji} {mood.label} playlist — {songs.length} songs
        </p>
        <div className="song-list-bar" style={{ background: mood.color }} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="song-list-state">
          <div className="song-list-state-icon">🎵</div>
          <p>Loading playlist...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="song-list-state error">⚠️ {error}</div>
      )}

      {/* Songs */}
      {!loading && !error && (
        <div className="song-list-items">
          {songs.map((song, i) => (
            <SongItem
              key={song.videoId}
              song={song}
              index={i}
              isPlaying={currentSong?.videoId === song.videoId}
              mood={mood}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {/* Now Playing / Controls */}
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