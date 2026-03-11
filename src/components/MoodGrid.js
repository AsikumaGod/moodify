/**
 * MoodGrid.js
 *
 * Two visual states:
 *   - Expanded: full 2×2 card grid (at top of page, before scrolling)
 *   - Collapsed: compact sticky pill strip (controlled by parent via `collapsed` prop)
 *
 * The collapsed state is owned by App.js — NOT by a scroll listener inside
 * this component. This is the key fix: when a pill is tapped, the parent
 * locks collapsed=true before React re-renders, so the grid never flashes
 * back into view regardless of scroll position.
 */

import MoodCard from './MoodCard';
import '../styles/MoodGrid.css';

export default function MoodGrid({ moods, selectedMood, onSelect, collapsed, onCollapse }) {
  /**
   * Called when a pill button is tapped.
   * Tells the parent to lock collapsed=true BEFORE firing the mood change,
   * so the scroll listener in App never gets a chance to expand the grid.
   */
  const handlePillSelect = (id) => {
    onCollapse(true);   // Lock collapsed state in App immediately
    onSelect(id);       // Trigger playlist fetch
  };

  return (
    <div className={`mood-grid-wrapper ${collapsed ? 'mood-grid-wrapper--sticky' : ''}`}>

      {/* ── Full 2×2 grid (shown at top of page) ── */}
      <div className={`mood-grid ${collapsed ? 'mood-grid--hidden' : ''}`}>
        {moods.map((mood) => (
          <MoodCard
            key={mood.id}
            mood={mood}
            selected={mood.id === selectedMood}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* ── Compact sticky pill strip (shown when collapsed) ── */}
      <div className={`mood-pills ${collapsed ? 'mood-pills--visible' : ''}`}>
        {moods.map((mood) => (
          <button
            key={mood.id}
            className={`mood-pill ${mood.id === selectedMood ? 'mood-pill--active' : ''}`}
            style={mood.id === selectedMood ? {
              background: mood.color,
              color: '#0a0a0f',
              borderColor: mood.color,
            } : {
              borderColor: `${mood.color}55`,
            }}
            onClick={() => handlePillSelect(mood.id)}
            aria-pressed={mood.id === selectedMood}
          >
            <span className="mood-pill__emoji">{mood.emoji}</span>
            <span className="mood-pill__label">{mood.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}