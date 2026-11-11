import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TafsirPanel from './TafsirPanel';
import AudioButton from '../components/AudioButton';
import ReadingModeBar from '../components/ReadingModeBar';
import { useReading } from '../context/ReadingContext';

export default function JuzDetail() {
  const { juzNumber } = useParams();
  const { isAuthenticated } = useAuth();
  const { settings } = useReading();
  const showArabic = settings.mode !== 'translation';
  const showTranslation = settings.mode !== 'arabic';
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedVerseIds, setSavedVerseIds] = useState(new Set());
  const [memorizingVerseIds, setMemorizingVerseIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    api
      .getJuzVerses(juzNumber)
      .then(setVerses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [juzNumber]);

  async function handleBookmark(verseId) {
    if (!isAuthenticated) return;
    try {
      await api.createBookmark(verseId, null);
      setSavedVerseIds((prev) => new Set(prev).add(verseId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddToMemorization(verseId) {
    if (!isAuthenticated) return;
    try {
      await api.addToMemorization(verseId);
      setMemorizingVerseIds((prev) => new Set(prev).add(verseId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <Link to="/" className="muted">&larr; All Juz</Link>
      <h1 style={{ marginTop: '0.75rem' }}>Juz {juzNumber}</h1>
      <ReadingModeBar />
      {loading && <p className="muted">Loading verses…</p>}
      {error && <p className="error-text">{error}</p>}

      {verses.map((item) => (
        <div key={item.verse.id} className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
            <span className="eyebrow">{item.surah_name_transliteration} · Ayah {item.verse.ayah_number}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <AudioButton surahId={item.verse.surah_id} ayahNumber={item.verse.ayah_number} />
              {isAuthenticated && (
                <>
                  <button
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
                    onClick={() => handleAddToMemorization(item.verse.id)}
                    disabled={memorizingVerseIds.has(item.verse.id)}
                  >
                    {memorizingVerseIds.has(item.verse.id) ? 'Memorizing ✦' : '+ Memorize'}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
                    onClick={() => handleBookmark(item.verse.id)}
                    disabled={savedVerseIds.has(item.verse.id)}
                  >
                    {savedVerseIds.has(item.verse.id) ? 'Saved ✓' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
          {showArabic && <p className="arabic-text">{item.verse.text_arabic}</p>}
          {showTranslation && <p>{item.verse.text_translation_en}</p>}
          <TafsirPanel verseId={item.verse.id} />
        </div>
      ))}
    </div>
  );
}
