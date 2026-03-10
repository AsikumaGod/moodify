import MoodCard from './MoodCard';
import '../styles/MoodGrid.css';

export default function MoodGrid({ moods, selectedMood, onSelect }) {
  return (
    <div className="mood-grid">
      {moods.map((m) => (
        <MoodCard
          key={m.id}
          mood={m}
          isSelected={selectedMood === m.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}