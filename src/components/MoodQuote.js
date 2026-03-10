/**
 * MoodQuote.js
 *
 * Displays a random inspirational quote fetched from the ZenQuotes API.
 * A fresh quote is pulled every time the user selects a mood.
 *
 * API used: https://zenquotes.io/api/random
 *   - Free, no API key required
 *   - Returns: [{ q: "quote text", a: "author name" }]
 *
 * Visual states:
 *   - Hidden  : No mood selected yet
 *   - Loading : Animated bouncing dots while fetching
 *   - Visible : Quote fades in once loaded
 *   - Error   : Silently hidden — quote is decorative, not critical
 */

import { useEffect, useState } from 'react';
import '../styles/MoodQuote.css';

/** ZenQuotes random quote endpoint */
const ZENQUOTES_URL = 'https://zenquotes.io/api/random';

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
      // No mood active — clear any previous quote
      setQuote(null);
      setVisible(false);
      return;
    }

    const fetchQuote = async () => {
      // Reset state for the new fetch cycle
      setLoading(true);
      setVisible(false);
      setQuote(null);

      try {
        // ZenQuotes requires a CORS proxy in browser environments
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(ZENQUOTES_URL)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();

        // allorigins wraps the response body as a JSON string in data.contents
        const parsed = JSON.parse(data.contents);
        const item = parsed[0];

        setQuote({
          text: item.q,   // "q" is the quote text in ZenQuotes' schema
          author: item.a, // "a" is the author name
        });

        // Short delay before fading in so the transition is noticeable
        setTimeout(() => setVisible(true), 80);
      } catch (err) {
        // Fail silently — the quote banner is a nice-to-have, not essential
        console.warn('MoodQuote fetch failed:', err);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [mood?.id]); // Re-fetch on every mood change

  // Render nothing when no mood is active and nothing is loading
  if (!mood || (!loading && !quote)) return null;

  return (
    <div
      className={`mood-quote ${visible ? 'mood-quote--visible' : ''}`}
      style={{
        borderLeft: `3px solid ${mood.color}`,
        background: `${mood.color}0C`,
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