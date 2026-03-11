/**
 * App.js
 *
 * Root component of Moodify.
 * Responsibilities:
 *  - Manages all top-level state (selected mood, song list, playback)
 *  - Fetches songs from the YouTube Playlist API when the mood changes
 *  - Passes data and handlers down to child components
 *  - Renders the hidden <Player> which controls the YouTube IFrame API
 *
 * State flow:
 *   User picks mood → fetchPlaylist() + MoodQuote fetches quote in parallel
 *   User clicks song → handleSongSelect() → Player plays audio
 *   User clicks prev/next → handlePrev/Next() → Player switches song
 */

import { useState, useEffect, useRef } from 'react';
import './App.css';

import moods from './data/moods';
import Header from './components/Header';
import MoodGrid from './components/MoodGrid';
import MoodQuote from './components/MoodQuote';
import MoodBackground from './components/MoodBackground';
import CreatorBadge from './components/CreatorBadge';
import SongList from './components/SongList';
import Player from './components/Player';

// YouTube Data API key — stored safely in .env as REACT_APP_YOUTUBE_API_KEY
const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

// YouTube API returns max 50 items per page — we paginate to get all songs
const PAGE_SIZE = 50;

// Titles YouTube returns for unavailable videos — we filter these out
const UNAVAILABLE_TITLES = ['Deleted video', 'Private video'];

export default function App() {
  // ID of the currently selected mood (e.g. "happy", "calm")
  const [selectedMood, setSelectedMood] = useState(null);

  // Songs fetched from the YouTube playlist for the active mood
  const [songs, setSongs] = useState([]);

  // True while fetching songs from the API
  const [loading, setLoading] = useState(false);

  // Holds an error message string if the API call fails, otherwise null
  const [error, setError] = useState(null);

  // The song object currently loaded in the player (may be paused)
  const [currentSong, setCurrentSong] = useState(null);

  // Whether the player is actively playing (true) or paused (false)
  const [isPlaying, setIsPlaying] = useState(false);

  // Firefox blocks autoplay — this flag triggers a visible tap-to-play nudge
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Whether the mood grid is collapsed into the sticky pill strip.
  // Owned here (not in MoodGrid) so pill selection can lock it before re-render.
  const [gridCollapsed, setGridCollapsed] = useState(false);

  // Ref so the scroll listener always reads the latest locked value
  const gridLockedRef = useRef(false);

  // Collapse the grid on scroll; respect the lock set by pill selection
  useEffect(() => {
    const handleScroll = () => {
      if (gridLockedRef.current) return;
      setGridCollapsed(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve the full mood object from the selected ID
  const mood = moods.find((m) => m.id === selectedMood);

  /**
   * Fetch ALL songs from a YouTube playlist by paginating through every page.
   *
   * YouTube's API returns max 50 items per request. We keep following
   * nextPageToken until there are no more pages, accumulating all results.
   *
   * Songs stream in progressively — the list updates after each page so the
   * user sees songs appearing rather than waiting for everything to finish.
   */
  useEffect(() => {
    if (!selectedMood || !mood) return;

    // Abort controller lets us cancel in-flight fetches if mood changes mid-load
    const controller = new AbortController();

    const fetchAllPages = async () => {
      setLoading(true);
      setError(null);
      setSongs([]);
      setCurrentSong(null);
      setIsPlaying(false);

      let allSongs   = [];
      let pageToken  = '';
      let firstPage  = true;

      try {
        // Keep fetching pages until YouTube says there are no more
        do {
          const url =
            `https://www.googleapis.com/youtube/v3/playlistItems` +
            `?part=snippet` +
            `&maxResults=${PAGE_SIZE}` +
            `&playlistId=${mood.playlistId}` +
            `&key=${API_KEY}` +
            (pageToken ? `&pageToken=${pageToken}` : '');

          const res  = await fetch(url, { signal: controller.signal });
          const data = await res.json();

          if (data.error) {
            setError(`API error: ${data.error.message}`);
            return;
          }

          // Normalise this page's items and filter unavailable videos
          const pageSongs = data.items
            .filter(
              (item) =>
                !UNAVAILABLE_TITLES.includes(item.snippet.title) &&
                item.snippet.resourceId?.videoId
            )
            .map((item) => ({
              title:     item.snippet.title,
              artist:    item.snippet.videoOwnerChannelTitle || 'Unknown',
              videoId:   item.snippet.resourceId.videoId,
              thumbnail:
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url ||
                '',
            }));

          allSongs = [...allSongs, ...pageSongs];

          // Stream results in progressively so the list isn't blank while loading
          setSongs([...allSongs]);

          // Auto-play a random song from the very first page immediately
          // so music starts without waiting for all pages to load
          if (firstPage && allSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * allSongs.length);
            setCurrentSong(allSongs[randomIndex]);
            setIsPlaying(true);
            firstPage = false;
          }

          // Advance to next page (undefined means we are on the last page)
          pageToken = data.nextPageToken || '';

        } while (pageToken);

      } catch (err) {
        if (err.name === 'AbortError') return; // Mood changed mid-fetch — ignore
        setError('Failed to load playlist. Check your API key in .env');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPages();

    // Cancel any in-flight requests if the mood changes before they complete
    return () => controller.abort();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood]); // mood is derived from selectedMood — safe to omit

  /**
   * Called when the user clicks a mood card.
   * Avoids unnecessary re-renders by ignoring clicks on the already active mood.
   */
  const handleMoodSelect = (id) => {
    if (id !== selectedMood) setSelectedMood(id);
  };

  /**
   * Called by MoodGrid when the user taps a pill in the sticky strip.
   * Locks the grid collapsed BEFORE the mood state updates so React's
   * re-render never sees collapsed=false and the grid never flashes back.
   */
  const handleGridCollapse = (value) => {
    gridLockedRef.current = value;
    setGridCollapsed(value);
    // Release the lock after the re-render + fetch have settled
    if (value) {
      setTimeout(() => {
        gridLockedRef.current = false;
      }, 800);
    }
  };

  /**
   * Called when the user clicks a song row.
   * - Same song clicked: toggle play/pause
   * - New song clicked: load it and auto-play
   */
  const handleSongSelect = (song) => {
    if (currentSong?.videoId === song.videoId) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  /** Advance to the next song, wrapping around at the end of the list */
  const handleNext = () => {
    if (!songs.length) return;
    const currentIndex = songs.findIndex((s) => s.videoId === currentSong?.videoId);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  /** Go back to the previous song, wrapping around at the start */
  const handlePrev = () => {
    if (!songs.length) return;
    const currentIndex = songs.findIndex((s) => s.videoId === currentSong?.videoId);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  /** Called by Player when a song ends — auto-advance to next */
  const handleEnded = () => handleNext();

  return (
    <div className="app">

      {/*
        Dynamic animated background — three large blurred colour orbs that
        float and drift, each mood having its own colour palette and base gradient.
        Replaces the old faint static radial gradient.
      */}
      <MoodBackground mood={mood} />

      {/* Scrollable content area, centered and max-width capped */}
      <div className="app-content">

        {/* Title that transitions its gradient colour on mood change */}
        <Header mood={mood} />

        {/* 2×2 grid of mood selector cards */}
        <MoodGrid
          moods={moods}
          selectedMood={selectedMood}
          onSelect={handleMoodSelect}
          collapsed={gridCollapsed}
          onCollapse={handleGridCollapse}
        />

        {/* Random quote fetched from ZenQuotes on each mood selection */}
        <MoodQuote mood={mood} />

        {/* Song list + now-playing bar — always mounted, hidden until a mood is picked.
            Keeping it mounted prevents unmount/remount scroll jumps when switching moods. */}
        {mood && (
          <SongList
            mood={mood}
            songs={songs}
            loading={loading}
            error={error}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onSelect={handleSongSelect}
            onPlayPause={() => setIsPlaying((p) => !p)}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </div>

      {/* Creator watermark — fixed bottom-left */}
      <CreatorBadge />

      {/* Firefox autoplay nudge — only shown when Firefox blocks audio */}
      {autoplayBlocked && (
        <div
          style={{
            position: 'fixed', bottom: '80px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,30,0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '10px 22px',
            color: 'white',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif'",
            letterSpacing: '0.05em',
            zIndex: 200,
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          🔇 Tap anywhere to enable audio
        </div>
      )}

      {/* Hidden 1×1px YouTube iframe — drives all audio playback */}
      <Player
        song={currentSong}
        isPlaying={isPlaying}
        onEnded={handleEnded}
        onBlocked={setAutoplayBlocked}
      />
    </div>
  );
}