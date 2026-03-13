/**
 * MoodCard.js
 *
 * An individual mood selector card in the 2×2 grid.
 *
 * Visual states:
 *   - Default   : Desaturated background image, subtle gradient overlay
 *   - Hovered   : Brighter image, stronger gradient, slight scale-up
 *   - Selected  : Coloured border glow, image brightens, stays slightly scaled
 *
 * All colour values come from the mood object so this component
 * works for any mood without hardcoded styles.
 */

import '../styles/MoodCard.css';

/**
 * MoodCard component.
 *
 * @param {Object}   props
 * @param {Object}   props.mood       - Mood data { id, label, emoji, color, accent, image }
 * @param {boolean}  props.isSelected - Whether this card is the currently active mood
 * @param {Function} props.onSelect   - Called with mood.id when the card is clicked
 */
export default function MoodCard({ mood, isSelected, onSelect }) {
  return (
    <div
      className={`mood-card ${isSelected ? 'selected' : ''}`}
      style={{
        // Multi-layer glow: tight inner ring + wide soft halo
        boxShadow: isSelected
          ? `0 0 0 2px ${mood.color}99, 0 0 24px 4px ${mood.color}66, 0 0 48px 8px ${mood.color}33`
          : 'none',
      }}
      onClick={() => onSelect(mood.id)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select ${mood.label} mood`}
      onKeyDown={(e) => {
        // Support keyboard activation for accessibility
        if (e.key === 'Enter' || e.key === ' ') onSelect(mood.id);
      }}
    >
      {/* Background photo — desaturated by default, brightens on hover/select via CSS */}
      <img
        className="mood-card-img"
        src={mood.image}
        alt="" // Decorative — label text already describes the mood
      />

      {/* Colour gradient overlay — becomes more opaque on hover/select via CSS */}
      <div
        className="mood-card-overlay"
        style={{
          background: `linear-gradient(135deg, ${mood.color}44, ${mood.accent}33)`,
        }}
      />

      {/* Centred emoji and label text — always on top of the image layers */}
      <div className="mood-card-content">
        <span className="mood-card-emoji" aria-hidden="true">
          {mood.emoji}
        </span>
        <span className="mood-card-label">{mood.label}</span>
      </div>
    </div>
  );
}