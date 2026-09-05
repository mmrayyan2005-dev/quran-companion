import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function HadithAll() {
  const { collectionKey } = useParams();
  const [hadiths, setHadiths] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .browseHadithCollection(collectionKey, page)
      .then(setHadiths)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [collectionKey, page]);

  return (
    <div className="page">
      <Link to={`/hadith/${collectionKey}`} className="muted">&larr; Back to books</Link>
      <h1 style={{ marginTop: '0.75rem', textTransform: 'capitalize' }}>{collectionKey} — All</h1>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {hadiths.map((h) => (
        <div key={h.id} className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="eyebrow">
              Hadith #{h.hadith_number}{h.book_name && ` · ${h.book_name}`}
            </span>
            {h.grade && <span className="muted" style={{ fontSize: '0.8rem' }}>{h.grade}</span>}
          </div>
          {h.text_arabic && <p className="arabic-text" style={{ marginTop: '0.5rem' }}>{h.text_arabic}</p>}
          <p>{h.text_english}</p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.5em 1em' }}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          ← Previous
        </button>
        <span className="muted" style={{ alignSelf: 'center' }}>Page {page}</span>
        <button
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.5em 1em' }}
          onClick={() => setPage((p) => p + 1)}
          disabled={hadiths.length < 20 || loading}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
