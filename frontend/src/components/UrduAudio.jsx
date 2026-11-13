import { useEffect, useRef, useState } from 'react';
import { claimAudio, releaseAudio } from './audioManager';

// Urdu voice: Shamshad Ali Khan reading Fateh Muhammad Jalandhry's translation.
// EveryAyah serves one MP3 per ayah, named as 3-digit surah + 3-digit ayah, the
// same pattern as the Arabic recitation in AudioButton. Nothing is hosted by us:
// if EveryAyah ever changes, only these buttons stop working, not the rest of the app.
const URDU_FOLDER = 'translations/urdu_shamshad_ali_khan_46kbps';

function pad3(n) {
  return String(n).padStart(3, '0');
}

export function getUrduAudioUrl(surahId, ayahNumber) {
  return `https://everyayah.com/data/${URDU_FOLDER}/${pad3(surahId)}${pad3(ayahNumber)}.mp3`;
}

const pillStyle = { width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' };

// Button for a single ayah.
export function UrduAyahButton({ surahId, ayahNumber }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      releaseAudio(audioRef.current);
    }
  }, []);

  if (error) return <span className="muted" style={{ fontSize: '0.8rem' }}>Urdu audio unavailable</span>;

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(getUrduAudioUrl(surahId, ayahNumber));
      audioRef.current.addEventListener('ended', () => setPlaying(false));
      audioRef.current.addEventListener('error', () => {
        setError(true);
        setPlaying(false);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      claimAudio(audioRef.current, () => setPlaying(false));
      audioRef.current.play().catch(() => setError(true));
      setPlaying(true);
    }
  }

  return (
    <button
      className="btn-secondary"
      style={pillStyle}
      onClick={toggle}
      title="Urdu translation read by Shamshad Ali Khan"
    >
      {playing ? '⏸ Pause' : '▶ اردو'}
    </button>
  );
}

// Plays every ayah in `verses` (objects with surah_id and ayah_number) in order, in Urdu.
export function UrduPlayAll({ verses, label }) {
  const audioRef = useRef(null);
  const indexRef = useRef(0);
  const listRef = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // 1-based ayah being played; 0 = not started
  const [error, setError] = useState(false);

  const list = [...verses].sort((a, b) => a.surah_id - b.surah_id || a.ayah_number - b.ayah_number);
  listRef.current = list;

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      releaseAudio(audioRef.current);
    }
  }, []);

  function playIndex(i) {
    const audio = audioRef.current;
    const item = listRef.current[i];
    indexRef.current = i;
    setPosition(i + 1);
    audio.src = getUrduAudioUrl(item.surah_id, item.ayah_number);
    audio.play().catch(() => {
      setError(true);
      setPlaying(false);
    });
  }

  function ensureAudio() {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener('ended', () => {
        const next = indexRef.current + 1;
        if (next < listRef.current.length) {
          playIndex(next);
        } else {
          setPlaying(false);
          setPosition(0);
          indexRef.current = 0;
        }
      });
      audio.addEventListener('error', () => {
        setError(true);
        setPlaying(false);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }

  function toggle() {
    const audio = ensureAudio();
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    claimAudio(audio, () => setPlaying(false));
    setPlaying(true);
    if (position > 0) {
      audio.play().catch(() => setError(true)); // resume where it paused
    } else {
      playIndex(0);
    }
  }

  function stop() {
    if (audioRef.current) audioRef.current.pause();
    indexRef.current = 0;
    setPosition(0);
    setPlaying(false);
  }

  if (list.length === 0) return null;
  if (error) return <p className="muted" style={{ fontSize: '0.85rem' }}>Urdu audio unavailable right now.</p>;

  return (
    <div style={{ margin: '0.5rem 0 1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" style={{ width: 'auto', padding: '0.45em 1.1em', fontSize: '0.9rem' }} onClick={toggle}>
          {playing ? '⏸ Pause' : position > 0 ? '▶ Resume' : `▶ ${label}`}
        </button>
        {position > 0 && (
          <>
            <button className="btn-secondary" style={pillStyle} onClick={stop}>■ Stop</button>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Ayah {position} of {list.length}</span>
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
        Urdu voice: Shamshad Ali Khan, reading Fateh Muhammad Jalandhry's translation.
      </p>
    </div>
  );
}
