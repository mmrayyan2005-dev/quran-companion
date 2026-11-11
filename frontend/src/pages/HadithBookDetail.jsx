import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import ReadingModeBar from '../components/ReadingModeBar';
import { useReading } from '../context/ReadingContext';

export default function HadithBookDetail() {
  const { collectionKey, bookNumber } = useParams();
  const { settings } = useReading();
  const showArabic = settings.mode !== 'translation';
  const showTranslation = settings.mode !== 'arabic';
  const [hadiths, setHadiths] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .browseHadithBook(collectionKey, bookNumber, page)
      .then(setHadiths)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [collectionKey, bookNumber, page]);

  const bookName = hadiths[0]?.book_name;

  return (
    <div className="page">
      <Link to={`/hadith/${collectionKey}`} className="muted">&larr; All books</Link>
      <h1 style={{ marginTop: '0.75rem' }}>{bookName || `Book ${bookNumber}`}</h1>
      <ReadingModeBar />

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && hadiths.length === 0 && page === 1 && (
        <div className="empty-state">No hadiths found in this book.</div>
      )}

      {hadiths.map((h) => (
        <div key={h.id} className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="eyebrow">Hadith #{h.hadith_number}</span>
            {h.grade && <span className="muted" style={{ fontSize: '0.8rem' }}>{h.grade}</span>}
          </div>
          {showArabic && h.text_arabic && <p className="arabic-text" style={{ marginTop: '0.5rem' }}>{h.text_arabic}</p>}
          {/* If a hadith has no Arabic text, still show the translation so the card is never empty */}
          {(showTranslation || !h.text_arabic) && <p>{h.text_english}</p>}
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
