import { useState } from 'react';
import { api } from '../api/client';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (q.trim().length < 2) {
      setError('Type at least 2 characters to search.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await api.searchVerses(q.trim());
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">Quran Study Companion</p>
      <h1>Search</h1>
      <p className="muted">Search the English translation for a word or phrase.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. mercy, patience, forgiveness…"
          style={{ flex: 1 }}
        />
        <button className="btn" type="submit" style={{ width: 'auto', padding: '0.75em 1.25em' }}>
          Go
        </button>
      </form>

      {loading && <p className="muted">Searching…</p>}
      {error && <p className="error-text">{error}</p>}

      {results && results.length > 0 && (
        <p className="muted" style={{ marginBottom: '1rem' }}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </p>
      )}

      {results && results.length === 0 && (
        <div className="empty-state">No verses found for "{q}". Try a different word.</div>
      )}

      {results?.map((r) => (
        <div key={r.verse.id} className="card" style={{ cursor: 'default' }}>
          <span className="eyebrow">{r.surah_name_english} · Ayah {r.verse.ayah_number}</span>
          <p style={{ marginTop: '0.5rem' }}>{r.verse.text_translation_en}</p>
        </div>
      ))}
    </div>
  );
}
