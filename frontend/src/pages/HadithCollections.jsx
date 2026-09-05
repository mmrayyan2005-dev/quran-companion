import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function HadithCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listHadithCollections()
      .then(setCollections)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <p className="eyebrow">Quran Study Companion</p>
      <h1>Hadith</h1>
      <p className="muted">Sayings and actions of the Prophet ﷺ, from the major collections.</p>
      <div className="divider"><span className="divider-mark" /></div>

      {loading && <p className="muted">Loading collections…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && collections.length === 0 && (
        <div className="empty-state">
          No hadith collections available yet — ingestion may still be in progress.
        </div>
      )}

      {collections.map((c) => (
        <Link key={c.key} to={`/hadith/${c.key}`} className="card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <strong style={{ fontFamily: 'var(--font-display)' }}>{c.name}</strong>
              <div className="muted">
                {c.author && `${c.author} · `}{c.total_hadiths.toLocaleString()} hadiths
                {c.reliability && ` · ${c.reliability}`}
              </div>
            </div>
            {c.arabic_name && (
              <span className="arabic-text" style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                {c.arabic_name}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
