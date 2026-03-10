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

import { useState, useEffect } from 'react';
import './App.css';

import moods from './data/moods';
import Header from './components/Header';
import MoodGrid from './components/MoodGrid';
import MoodQuote from './components/MoodQuote';
import MoodBackground from './components/MoodBackground';
import SongList from './components/SongList';
import Player from './components/Player';

// YouTube Data API key — stored safely in .env as REACT_APP_YOUTUBE_API_KEY
const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

// Maximum number of songs to fetch per playlist
const MAX_RESULTS = 20;

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

  // Resolve the full mood object from the selected ID
  const mood = moods.find((m) => m.id === selectedMood);

  /**
   * Fetch songs from YouTube's playlistItems endpoint whenever the mood changes.
   * Filters out deleted/private videos and normalises each item into a Song shape.
   */
  useEffect(() => {
    if (!selectedMood || !mood) return;

    const fetchPlaylist = async () => {
      setLoading(true);
      setError(null);
      setSongs([]);
      setCurrentSong(null);
      setIsPlaying(false);

      try {
        const url =
          `https://www.googleapis.com/youtube/v3/playlistItems` +
          `?part=snippet` +
          `&maxResults=${MAX_RESULTS}` +
          `&playlistId=${mood.playlistId}` +
          `&key=${API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          setError(`API error: ${data.error.message}`);
          return;
        }

        const results = data.items
          .filter(
            (item) =>
              !UNAVAILABLE_TITLES.includes(item.snippet.title) &&
              item.snippet.resourceId?.videoId
          )
          .map((item) => ({
            title: item.snippet.title,
            artist: item.snippet.videoOwnerChannelTitle || 'Unknown',
            videoId: item.snippet.resourceId.videoId,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              '',
          }));

        setSongs(results);

        // Auto-play a random song from the playlist as soon as it loads
        if (results.length > 0) {
          const randomIndex = Math.floor(Math.random() * results.length);
          setCurrentSong(results[randomIndex]);
          setIsPlaying(true);
        }
      } catch (err) {
        setError('Failed to load playlist. Check your API key in .env');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [selectedMood]);

  /**
   * Called when the user clicks a mood card.
   * Avoids unnecessary re-renders by ignoring clicks on the already active mood.
   */
  const handleMoodSelect = (id) => {
    if (id !== selectedMood) setSelectedMood(id);
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
        />

        {/* Random quote fetched from ZenQuotes on each mood selection */}
        <MoodQuote mood={mood} />

        {/* Song list + now-playing bar — shown after a mood is picked */}
        {selectedMood && mood && (
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

      {/* Hidden 1×1px YouTube iframe — drives all audio playback */}
      <Player
        song={currentSong}
        isPlaying={isPlaying}
        onEnded={handleEnded}
      />
    </div>
  );
}