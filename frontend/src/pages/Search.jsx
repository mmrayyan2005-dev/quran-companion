import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import VerseText from '../components/VerseText';

export default function Search() {
  const [mode, setMode] = useState('ask'); // 'ask' = question or topic, 'exact' = word or phrase
  const [q, setQ] = useState('');
  const [searched, setSearched] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function switchMode(next) {
    setMode(next);
    setResults(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = q.trim();
    const minLength = mode === 'ask' ? 3 : 2;
    if (text.length < minLength) {
      setError(`Type at least ${minLength} characters to search.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = mode === 'ask' ? await api.askVerses(text) : await api.searchVerses(text);
      setSearched(text);
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
      <p className="muted">
        {mode === 'ask'
          ? 'Ask a question or type a topic, and get the most relevant verses.'
          : 'Search the English translation for an exact word or phrase.'}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <button
          className={mode === 'ask' ? 'btn' : 'btn-secondary'}
          style={{ width: 'auto', padding: '0.5em 1.2em' }}
          onClick={() => switchMode('ask')}
        >
          Ask
        </button>
        <button
          className={mode === 'exact' ? 'btn' : 'btn-secondary'}
          style={{ width: 'auto', padding: '0.5em 1.2em' }}
          onClick={() => switchMode('exact')}
        >
          Exact phrase
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            mode === 'ask' ? 'e.g. how to be patient, kindness to parents…' : 'e.g. mercy, patience, forgiveness…'
          }
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
          {mode === 'ask' ? ' · best matches first' : ''}
        </p>
      )}

      {results && results.length === 0 && (
        <div className="empty-state">
          No verses found for "{searched}". Try different words
          {mode === 'exact' ? ', or switch to Ask.' : '.'}
        </div>
      )}

      {results?.map((r) => (
        <div key={r.verse.id} className="card" style={{ cursor: 'default' }}>
          <span className="eyebrow">{r.surah_name_english} · Ayah {r.verse.ayah_number}</span>
          <VerseText verse={r.verse} />
          <Link
            to={`/surah/${r.verse.surah_id}?ayah=${r.verse.ayah_number}`}
            className="muted"
            style={{ fontSize: '0.85rem' }}
          >
            Read in context &rarr;
          </Link>
        </div>
      ))}

      {mode === 'ask' && (
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '1.5rem' }}>
          Ask finds verses by matching the topic words in the English translation. It doesn't interpret
          the verses. For meaning and context, read the tafsir on each surah page or consult a scholar.
        </p>
      )}
    </div>
  );
}