/**
 * MoodBackground.js
 *
 * Full-viewport animated background that transforms with each mood.
 *
 * Each mood gets a completely different visual atmosphere built from:
 *   - A base gradient that covers the full screen
 *   - Three large blurred colour orbs that float and drift slowly
 *   - A subtle SVG noise grain overlay for depth and texture
 *
 * All transitions between moods animate smoothly over 1.5s via CSS.
 */


import '../styles/MoodBackground.css';

/**
 * Mood-specific background configurations.
 * Each entry defines the full visual atmosphere for that mood.
 *
 * @type {Object.<string, { base: string, orbs: Array }>}
 */
const MOOD_BACKGROUNDS = {
  happy: {
    // Warm sunrise gradient base
    base: 'linear-gradient(135deg, #1a0a00 0%, #0f0800 50%, #1a0500 100%)',
    orbs: [
      { color: '#FF9500', size: '75vw', top: '-20%', left: '-15%', blur: '90px', opacity: 0.45 },
      { color: '#FFD93D', size: '55vw', top: '30%',  left: '50%',  blur: '80px', opacity: 0.35 },
      { color: '#FF6B35', size: '45vw', top: '60%',  left: '-5%',  blur: '70px', opacity: 0.30 },
    ],
  },
  sad: {
    // Deep ocean gradient base
    base: 'linear-gradient(135deg, #00051a 0%, #020818 50%, #030b1f 100%)',
    orbs: [
      { color: '#1a3a7a', size: '80vw', top: '-25%', left: '-20%', blur: '100px', opacity: 0.55 },
      { color: '#4a6fa5', size: '55vw', top: '40%',  left: '45%',  blur: '85px',  opacity: 0.40 },
      { color: '#0d1b4b', size: '50vw', top: '55%',  left: '0%',   blur: '75px',  opacity: 0.45 },
    ],
  },
  energetic: {
    // Hot volcanic gradient base
    base: 'linear-gradient(135deg, #1a0003 0%, #150002 50%, #1a0500 100%)',
    orbs: [
      { color: '#FF1744', size: '85vw', top: '-30%', left: '-25%', blur: '95px',  opacity: 0.50 },
      { color: '#FF6348', size: '60vw', top: '35%',  left: '40%',  blur: '80px',  opacity: 0.40 },
      { color: '#FF4500', size: '45vw', top: '65%',  left: '5%',   blur: '70px',  opacity: 0.35 },
    ],
  },
  calm: {
    // Misty forest gradient base
    base: 'linear-gradient(135deg, #001a0a 0%, #00140a 50%, #001508 100%)',
    orbs: [
      { color: '#00a854', size: '70vw', top: '-15%', left: '-10%', blur: '90px',  opacity: 0.35 },
      { color: '#2ECC71', size: '50vw', top: '45%',  left: '50%',  blur: '80px',  opacity: 0.25 },
      { color: '#00796B', size: '45vw', top: '60%',  left: '0%',   blur: '70px',  opacity: 0.28 },
    ],
  },
};

/**
 * Default background when no mood is selected — pure dark, no orbs.
 */
const DEFAULT_BG = {
  base: '#07070d',
  orbs: [
    { color: '#ffffff', size: '60vw', top: '-20%', left: '-10%', blur: '80px', opacity: 0 },
    { color: '#ffffff', size: '50vw', top: '40%',  left: '50%',  blur: '80px', opacity: 0 },
    { color: '#ffffff', size: '40vw', top: '65%',  left: '10%',  blur: '80px', opacity: 0 },
  ],
};

/**
 * MoodBackground component.
 *
 * @param {Object|null} props.mood - Active mood object, or null if none selected
 */
export default function MoodBackground({ mood }) {
  const config = mood ? (MOOD_BACKGROUNDS[mood.id] ?? DEFAULT_BG) : DEFAULT_BG;

  return (
    <div className="mood-bg" aria-hidden="true">

      {/* ── Base gradient layer ───────────────────────────────── */}
      <div
        className="mood-bg-base"
        style={{ background: config.base }}
      />

      {/* ── Floating colour orbs ─────────────────────────────── */}
      {config.orbs.map((orb, i) => (
        <div
          key={i}
          className={`mood-bg-orb mood-bg-orb--${i + 1}`}
          style={{
            background: orb.color,
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            filter: `blur(${orb.blur})`,
            opacity: orb.opacity,
          }}
        />
      ))}

      {/* ── SVG noise grain overlay ───────────────────────────── */}
      {/*
        feTurbulence generates procedural noise.
        Blended over the orbs at low opacity to add film-grain texture.
      */}
      <svg className="mood-bg-noise" xmlns="http://www.w3.org/2000/svg">
        <filter id="bg-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bg-noise)" opacity="0.04" />
      </svg>

    </div>
  );
}