import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function Home() {
  const [view, setView] = useState('surah');
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
      <p className="muted">Browse by Surah (chapter) or by Juz (Para) — whichever fits how you're reading.</p>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <button
          className={view === 'surah' ? 'btn' : 'btn-secondary'}
          style={{ width: 'auto', padding: '0.5em 1.2em' }}
          onClick={() => setView('surah')}
        >
          By Surah
        </button>
        <button
          className={view === 'juz' ? 'btn' : 'btn-secondary'}
          style={{ width: 'auto', padding: '0.5em 1.2em' }}
          onClick={() => setView('juz')}
        >
          By Juz (Para)
        </button>
      </div>

      <div className="divider"><span className="divider-mark" /></div>

      {view === 'surah' && (
        <>
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
        </>
      )}

      {view === 'juz' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.6rem' }}>
          {JUZ_NUMBERS.map((n) => (
            <Link
              key={n}
              to={`/juz/${n}`}
              className="card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem 0.5rem', margin: 0 }}
            >
              <div style={{ textAlign: 'center' }}>
                <div className="muted" style={{ fontSize: '0.75rem' }}>Juz</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{n}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
