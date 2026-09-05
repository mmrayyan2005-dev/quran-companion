import { useRef, useState } from 'react';

// everyayah.com serves one MP3 per verse, named as 3-digit surah + 3-digit
// ayah (e.g. 001001.mp3 = Surah 1, Ayah 1). No API or ingestion needed —
// we just build the URL directly from numbers already in our data.
// Reciter: Mishary Rashid Alafasy, a widely used, well-recorded reciter.
const RECITER_FOLDER = 'Alafasy_128kbps';

function pad3(n) {
  return String(n).padStart(3, '0');
}

export function getRecitationUrl(surahId, ayahNumber) {
  return `https://everyayah.com/data/${RECITER_FOLDER}/${pad3(surahId)}${pad3(ayahNumber)}.mp3`;
}

export default function AudioButton({ surahId, ayahNumber }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(getRecitationUrl(surahId, ayahNumber));
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
      audioRef.current.play();
      setPlaying(true);
    }
  }

  if (error) {
    return <span className="muted" style={{ fontSize: '0.8rem' }}>Audio unavailable</span>;
  }

  return (
    <button
      className="btn-secondary"
      style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
      onClick={toggle}
      title="Recitation by Mishary Rashid Alafasy"
    >
      {playing ? '⏸ Pause' : '▶ Listen'}
    </button>
  );
}
