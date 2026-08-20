import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const OUTCOMES = [
  { key: 'again', label: 'Forgot', hint: 'Reset' },
  { key: 'hard', label: 'Hard', hint: 'Recalled with effort' },
  { key: 'good', label: 'Good', hint: 'Recalled it' },
  { key: 'easy', label: 'Easy', hint: 'No hesitation' },
];

export default function Memorize() {
  const { isAuthenticated } = useAuth();
  const [due, setDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getDueReviews()
      .then(setDue)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const current = due[0];

  async function handleOutcome(outcome) {
    try {
      await api.submitReview(current.verse_id, outcome);
      setDue((prev) => prev.slice(1));
      setRevealed(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">Spaced repetition</p>
      <h1>Memorize</h1>
      <div className="divider"><span className="divider-mark" /></div>

      {loading && <p className="muted">Loading your review queue…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && due.length === 0 && (
        <div className="empty-state">
          Nothing due for review right now. Bookmark verses and add them to memorization to build your queue.
        </div>
      )}

      {current && (
        <div className="card" style={{ cursor: 'default', textAlign: 'center', padding: '2rem 1.25rem' }}>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {current.verse.surah_name_english} · Ayah {current.verse.ayah_number}
          </p>
          <p style={{ fontSize: '1.6rem', lineHeight: 1.8, direction: 'rtl', margin: '0.75rem 0' }}>
            {current.verse.text_arabic}
          </p>
          <p className="muted" style={{ fontSize: '0.95rem' }}>
            {current.verse.text_translation_en}
          </p>
          <p className="muted" style={{ marginTop: '1.5rem' }}>
            {revealed ? 'How well did you recall it?' : 'Recall this verse, then reveal.'}
          </p>

          {!revealed ? (
            <button className="btn" onClick={() => setRevealed(true)}>
              Reveal
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem' }}>
              {OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  className="btn-secondary"
                  onClick={() => handleOutcome(o.key)}
                  title={o.hint}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {due.length > 1 && <p className="muted" style={{ textAlign: 'center' }}>{due.length - 1} more after this</p>}
    </div>
  );
}
