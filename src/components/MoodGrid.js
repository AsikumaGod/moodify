/**
 * MoodGrid.js
 *
 * Renders the mood selector. Behaviour:
 *   - At rest (top of page): full 2×2 grid of large cards
 *   - Scrolled down: shrinks into a compact sticky horizontal pill strip
 *     so the user can switch moods without scrolling back to the top
 */

import { useEffect, useState } from 'react';
import MoodCard from './MoodCard';
import '../styles/MoodGrid.css';

/** How far the user must scroll (px) before the grid collapses */
const SCROLL_THRESHOLD = 80;

export default function MoodGrid({ moods, selectedMood, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setCollapsed(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`mood-grid-wrapper ${collapsed ? 'mood-grid-wrapper--sticky' : ''}`}>
      {/* ── Full 2×2 grid (top of page) ── */}
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

      {/* ── Compact pill strip (sticky when scrolled) ── */}
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
            onClick={() => onSelect(mood.id)}
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