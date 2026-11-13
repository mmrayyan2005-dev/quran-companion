import { useState } from 'react';
import { getSpeed, setSpeed } from './audioManager';

const SPEEDS = [0.75, 1, 1.25, 1.5];
const pill = { width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' };

export default function SpeedControl() {
  const [speed, setLocal] = useState(getSpeed());

  function choose(s) {
    setSpeed(s);
    setLocal(s);
  }

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', margin: '0.5rem 0' }}>
      <span className="muted" style={{ fontSize: '0.85rem' }}>Audio speed:</span>
      {SPEEDS.map((s) => (
        <button key={s} className={s === speed ? 'btn' : 'btn-secondary'} style={pill} onClick={() => choose(s)}>
          {s}x
        </button>
      ))}
    </div>
  );
}