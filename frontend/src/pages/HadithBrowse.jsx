import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function HadithBrowse() {
  const { collectionKey } = useParams();
  const [books, setBooks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listHadithBooks(collectionKey)
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [collectionKey]);

  return (
    <div className="page">
      <Link to="/hadith" className="muted">&larr; All collections</Link>
      <h1 style={{ marginTop: '0.75rem', textTransform: 'capitalize' }}>{collectionKey}</h1>
      <p className="muted">Browse by topic (book), or see everything in order.</p>

      {loading && <p className="muted">Loading books…</p>}
      {error && <p className="error-text">{error}</p>}

      {books && books.length === 0 && (
        <div className="empty-state">
          Topic categorization isn't available for this collection yet.{' '}
          <Link to={`/hadith/${collectionKey}/all`}>Browse all hadiths instead &rarr;</Link>
        </div>
      )}

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
