import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Bookmarks() {
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .listBookmarks()
      .then(setBookmarks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  async function handleRemove(bookmarkId) {
    try {
      await api.deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">Your collection</p>
      <h1>Saved verses</h1>
      <div className="divider"><span className="divider-mark" /></div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && bookmarks.length === 0 && (
        <div className="empty-state">
          Nothing saved yet. Browse a surah and tap "Save" on a verse to keep it here.
        </div>
      )}

      {bookmarks.map((b) => (
        <div key={b.id} className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Link to={`/surah/${b.verse.surah_id}`} style={{ flex: 1 }}>
              <span className="eyebrow">{b.verse.surah_name_english} · Ayah {b.verse.ayah_number}</span>
            </Link>
            <button
              className="btn-secondary"
              style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px', flexShrink: 0 }}
              onClick={() => handleRemove(b.id)}
            >
              Remove
            </button>
          </div>
          <p className="arabic-text" style={{ marginTop: '0.75rem' }}>{b.verse.text_arabic}</p>
          <p>{b.verse.text_translation_en}</p>
          {b.note && (
            <p className="muted" style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.6rem', marginTop: '0.6rem' }}>
              Note: {b.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
