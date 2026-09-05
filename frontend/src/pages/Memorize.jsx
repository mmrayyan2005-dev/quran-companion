import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const OUTCOMES = [
  { key: 'again', label: 'Forgot', hint: 'I could not recall it' },
  { key: 'hard', label: 'Hard', hint: 'I recalled it, but it took real effort' },
  { key: 'good', label: 'Good', hint: 'I recalled it correctly, normal effort' },
  { key: 'easy', label: 'Easy', hint: 'I recalled it instantly, no hesitation' },
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
      <p className="muted">
        A tool for memorizing (hifz) verses without reviewing everything every day.
        Add a verse from the Read tab, then come back here - verses you know well
        get spaced further apart; ones you struggle with come back sooner.
      </p>
      <div className="divider"><span className="divider-mark" /></div>

      {loading && <p className="muted">Loading your review queue…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && due.length === 0 && (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem' }}>Nothing due for review right now.</p>
          <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            To get started: open any surah, tap "+ Memorize" on a
            verse, then come back here. It'll show up right away since it's brand
            new. Try to recall it, reveal the answer, and rate how well you did -
            the app schedules your next review automatically based on that rating.
          </p>
        </div>
      )}

      {current && (
        <div className="card" style={{ cursor: 'default', textAlign: 'center', padding: '2rem 1.25rem' }}>
          {current.verse && (
            <p className="muted" style={{ marginBottom: '0.5rem' }}>
              {current.verse.surah_name_english} · Ayah {current.verse.ayah_number}
            </p>
          )}
          <p className="muted">
            {revealed ? 'How well did you recall it?' : 'Try to recall this verse from memory, then reveal it.'}
          </p>

          {!revealed ? (
            <button className="btn" onClick={() => setRevealed(true)} style={{ marginTop: '1rem' }}>
              Reveal
            </button>
          ) : (
            <>
              {current.verse && (
                <div style={{ margin: '1.25rem 0', textAlign: 'left' }}>
                  <p className="arabic-text">{current.verse.text_arabic}</p>
                  <p>{current.verse.text_translation_en}</p>
                </div>
              )}
              <p className="muted" style={{ marginBottom: '0.75rem' }}>Be honest - this is what makes the schedule work for you.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
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
            </>
          )}
        </div>
      )}

      {due.length > 1 && <p className="muted" style={{ textAlign: 'center' }}>{due.length - 1} more after this</p>}
    </div>
  );
}
