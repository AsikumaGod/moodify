import '../styles/SongItem.css';

export default function SongItem({ song, index, isPlaying, mood, onSelect }) {
  return (
    <div
      className={`song-item ${isPlaying ? 'playing' : ''}`}
      style={{
        '--playing-bg': `${mood.color}1A`,
        '--playing-border': `${mood.color}55`,
      }}
      onClick={() => onSelect(song)}
    >
      <span className="song-index">{isPlaying ? '' : index + 1}</span>

      <img
        className="song-thumb"
        src={song.thumbnail}
        alt={song.title}
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      <div className="song-info">
        <p className="song-title">{song.title}</p>
        <p className="song-artist">{song.artist}</p>
      </div>

      {isPlaying && (
        <div className="song-eq">
          <div className="song-eq-bar" style={{ background: mood.color }} />
          <div className="song-eq-bar" style={{ background: mood.color }} />
          <div className="song-eq-bar" style={{ background: mood.color }} />
        </div>
      )}
    </div>
  );
}