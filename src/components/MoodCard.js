import '../styles/MoodCard.css';

export default function MoodCard({ mood, isSelected, onSelect }) {
  return (
    <div
      className={`mood-card ${isSelected ? 'selected' : ''}`}
      style={{
        border: isSelected ? `2px solid ${mood.color}` : '2px solid transparent',
        boxShadow: isSelected ? `0 0 32px ${mood.color}44` : 'none',
      }}
      onClick={() => onSelect(mood.id)}
    >
      <img className="mood-card-img" src={mood.image} alt={mood.label} />

      <div
        className="mood-card-overlay"
        style={{ background: `linear-gradient(135deg, ${mood.color}44, ${mood.accent}33)` }}
      />

      <div className="mood-card-content">
        <span className="mood-card-emoji">{mood.emoji}</span>
        <span className="mood-card-label">{mood.label}</span>
      </div>
    </div>
  );
}