import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TafsirPanel from './TafsirPanel';
import AudioButton from '../components/AudioButton';

export default function SurahDetail() {
  const { surahId } = useParams();
  const { isAuthenticated } = useAuth();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedVerseIds, setSavedVerseIds] = useState(new Set());
  const [memorizingVerseIds, setMemorizingVerseIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    api
      .getSurahVerses(surahId)
      .then(setVerses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [surahId]);

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
      <Link to="/" className="muted">&larr; All surahs</Link>
      {loading && <p className="muted">Loading verses…</p>}
      {error && <p className="error-text">{error}</p>}

      {verses.map((verse) => (
        <div key={verse.id} className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="eyebrow">Ayah {verse.ayah_number}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <AudioButton surahId={verse.surah_id} ayahNumber={verse.ayah_number} />
              {isAuthenticated && (
                <>
                  <button
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
                    onClick={() => handleAddToMemorization(verse.id)}
                    disabled={memorizingVerseIds.has(verse.id)}
                  >
                    {memorizingVerseIds.has(verse.id) ? 'Memorizing ✦' : '+ Memorize'}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
                    onClick={() => handleBookmark(verse.id)}
                    disabled={savedVerseIds.has(verse.id)}
                  >
                    {savedVerseIds.has(verse.id) ? 'Saved ✓' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="arabic-text">{verse.text_arabic}</p>
          <p>{verse.text_translation_en}</p>
          <TafsirPanel verseId={verse.id} />
        </div>
      ))}
    </div>
  );
}
