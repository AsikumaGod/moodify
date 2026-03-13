/**
 * MoodQuote.js
 *
 * Displays a random inspirational quote from ZenQuotes API.
 * Uses corsproxy.io as the CORS proxy — more reliable on mobile than allorigins.
 *
 * API: https://zenquotes.io/api/random
 * Proxy: https://corsproxy.io/?url=...
 */

import { useEffect, useState } from 'react';
import '../styles/MoodQuote.css';

const ZENQUOTES_URL = 'https://zenquotes.io/api/random';

const FALLBACK_QUOTE = {
  text: 'Music gives a soul to the universe, wings to the mind, and life to everything.',
  author: 'Plato',
};

export default function MoodQuote({ mood }) {
  const [quote, setQuote]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

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
        // corsproxy.io works consistently across desktop and mobile browsers
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(ZENQUOTES_URL)}`;
        const res = await fetch(proxyUrl);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const item = Array.isArray(data) ? data[0] : data;

        if (!item?.q) throw new Error('Invalid response');

        setQuote({ text: item.q, author: item.a });
      } catch (err) {
        console.warn('MoodQuote fetch failed, using fallback:', err);
        setQuote(FALLBACK_QUOTE);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      }
    };

    fetchQuote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood?.id]);

  if (!mood) return null;

  return (
    <div
      className={`mood-quote ${visible ? 'mood-quote--visible' : ''}`}
      style={{
        borderLeft: `3px solid ${mood.color}`,
        background:  `${mood.color}0C`,
      }}
    >
      {loading && (
        <div className="mood-quote-loading" aria-label="Loading quote">
          <span style={{ background: mood.color }} />
          <span style={{ background: mood.color }} />
          <span style={{ background: mood.color }} />
        </div>
      )}

      {!loading && quote && (
        <>
          <span
            className="mood-quote-mark"
            style={{ color: mood.color }}
            aria-hidden="true"
          >"</span>
          <div className="mood-quote-content">
            <p className="mood-quote-text">{quote.text}"</p>
            <p className="mood-quote-author">— {quote.author}</p>
          </div>
        </>
      )}
    </div>
  );
}