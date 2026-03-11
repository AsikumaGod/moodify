/**
 * MoodQuote.js
 *
 * Displays a random inspirational quote fetched from the Quotable API.
 * A fresh quote is pulled every time the user selects a mood.
 *
 * API used: https://api.quotable.io/random
 *   - Free, no API key required
 *   - Has native CORS support — works on all browsers including mobile Safari
 *   - Returns: { content: "quote text", author: "author name" }
 *
 * Visual states:
 *   - Hidden  : No mood selected yet
 *   - Loading : Animated bouncing dots while fetching
 *   - Visible : Quote fades in once loaded
 *   - Error   : Falls back to a hardcoded quote so something always shows
 */

import { useEffect, useState } from 'react';
import '../styles/MoodQuote.css';

/**
 * Quotable API endpoint — supports CORS natively, no proxy needed.
 * Works reliably on desktop and mobile browsers including Safari on iOS.
 */
const QUOTABLE_URL = 'https://api.quotable.io/random';

/**
 * Fallback quote shown if the API call fails (e.g. no internet connection).
 * Ensures the banner never appears empty.
 */
const FALLBACK_QUOTE = {
  text: 'Music gives a soul to the universe, wings to the mind, and life to everything.',
  author: 'Plato',
};

/**
 * MoodQuote component.
 *
 * @param {Object|null} props.mood - The active mood object, or null if none selected
 */
export default function MoodQuote({ mood }) {
  // The fetched quote object { text, author }
  const [quote, setQuote] = useState(null);

  // True while the API request is in flight
  const [loading, setLoading] = useState(false);

  // Controls the fade-in animation after the quote loads
  const [visible, setVisible] = useState(false);

  /**
   * Fetch a fresh random quote every time the user picks a mood.
   * Resets visibility first so the fade-in animation replays each time.
   */
  useEffect(() => {
    if (!mood) {
      setQuote(null);
      setVisible(false);
      return;
    }

    const fetchQuote = async () => {
      setLoading(true);
      setVisible(false);
      setQuote(null);

      try {
        // Quotable has native CORS headers — no proxy needed on any device
        const res = await fetch(QUOTABLE_URL);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        setQuote({
          text:   data.content, // Quotable uses "content" for the quote text
          author: data.author,  // and "author" for the attribution
        });
      } catch (err) {
        // Fall back to a hardcoded quote so the banner never appears broken
        console.warn('MoodQuote fetch failed, using fallback:', err);
        setQuote(FALLBACK_QUOTE);
      } finally {
        setLoading(false);
        // Short delay so the fade-in transition is noticeable
        setTimeout(() => setVisible(true), 80);
      }
    };

    fetchQuote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood?.id]); // Re-fetch on every mood change

  // Render nothing until a mood is selected
  if (!mood) return null;

  return (
    <div
      className={`mood-quote ${visible ? 'mood-quote--visible' : ''}`}
      style={{
        borderLeft: `3px solid ${mood.color}`,
        background:  `${mood.color}0C`,
      }}
    >
      {/* ── Loading: three bouncing dots ──────────────────────── */}
      {loading && (
        <div className="mood-quote-loading" aria-label="Loading quote">
          <span style={{ background: mood.color }} />
          <span style={{ background: mood.color }} />
          <span style={{ background: mood.color }} />
        </div>
      )}

      {/* ── Loaded: quote text and author ─────────────────────── */}
      {!loading && quote && (
        <>
          {/* Large decorative opening quotation mark */}
          <span
            className="mood-quote-mark"
            style={{ color: mood.color }}
            aria-hidden="true"
          >
            "
          </span>

          <div className="mood-quote-content">
            <p className="mood-quote-text">{quote.text}"</p>
            <p className="mood-quote-author">— {quote.author}</p>
          </div>
        </>
      )}
    </div>
  );
}