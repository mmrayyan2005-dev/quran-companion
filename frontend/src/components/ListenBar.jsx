import { useState } from 'react';
import { UrduPlayAll } from './UrduAudio';
import SpeedControl from './SpeedControl';

const MODES = [
  { value: 'both', label: 'Arabic → Urdu' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'urdu', label: 'Urdu' },
];
const pill = { width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px', whiteSpace: 'nowrap' };

// One compact panel for playing a whole surah or Juz.
// key={mode} restarts the player cleanly if the choice changes.
export default function ListenBar({ verses, scope = 'surah' }) {
  const [mode, setMode] = useState('both');

  return (
    <div className="card" style={{ cursor: 'default', margin: '0.75rem 0' }}>
      <span className="eyebrow">Listen to the whole {scope}</span>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0 0.2rem' }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            className={m.value === mode ? 'btn' : 'btn-secondary'}
            style={pill}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <SpeedControl />
      <UrduPlayAll key={mode} verses={verses} mode={mode} showCredit={false} label={`Play ${scope}`} />
      {mode !== 'arabic' && (
        <p className="muted" style={{ fontSize: '0.75rem', margin: 0 }}>
          Urdu voice: Shamshad Ali Khan, reading Fateh Muhammad Jalandhry's translation.
        </p>
      )}
    </div>
  );
}