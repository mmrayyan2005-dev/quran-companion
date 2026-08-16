import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Home() {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listSurahs()
      .then(setSurahs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <p className="eyebrow">Quran Study Companion</p>
      <h1>Read</h1>
      <p className="muted">114 surahs, in order of the mushaf.</p>
      <div className="divider"><span className="divider-mark" /></div>

      {loading && <p className="muted">Loading surahs…</p>}
      {error && <p className="error-text">Couldn't load surahs: {error}</p>}

      {surahs.map((surah) => (
        <Link key={surah.id} to={`/surah/${surah.id}`} className="card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <span className="muted">{surah.id}.</span>{' '}
              <strong style={{ fontFamily: 'var(--font-display)' }}>{surah.name_transliteration}</strong>
              <div className="muted">{surah.name_english} · {surah.verse_count} verses</div>
            </div>
            <span className="arabic-text" style={{ fontSize: '1.3rem', lineHeight: 1 }}>
              {surah.name_arabic}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
