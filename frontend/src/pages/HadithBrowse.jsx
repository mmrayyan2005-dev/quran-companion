import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';

export default function HadithBrowse() {
  const { collectionKey } = useParams();
  const [books, setBooks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setBooks(null);
    setError(null);
    setLoading(true);
    api
      .listHadithBooks(collectionKey)
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [collectionKey]);

  // Collections without books (like Qudsi) go straight to their hadiths.
  // "replace" keeps the Back button working: it returns to the collections list.
  if (books && books.length === 0) {
    return <Navigate to={`/hadith/${collectionKey}/all`} replace />;
  }

  return (
    <div className="page">
      <Link to="/hadith" className="muted">&larr; All collections</Link>
      <h1 style={{ marginTop: '0.75rem', textTransform: 'capitalize' }}>{collectionKey}</h1>
      <p className="muted">Browse by topic (book), or see everything in order.</p>

      {loading && <p className="muted">Loading books…</p>}
      {error && <p className="error-text">{error}</p>}

      {books && books.length > 0 && (
        <>
          <Link to={`/hadith/${collectionKey}/all`} className="card" style={{ display: 'block' }}>
            <strong>All hadiths</strong>
            <div className="muted">Browse the full collection in order, not by topic</div>
          </Link>

          {books.map((b) => (
            <Link key={b.book_number} to={`/hadith/${collectionKey}/book/${b.book_number}`} className="card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontFamily: 'var(--font-display)' }}>{b.book_name}</strong>
                <span className="muted">Book {b.book_number}</span>
              </div>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}