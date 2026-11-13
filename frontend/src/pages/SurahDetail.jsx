import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TafsirPanel from './TafsirPanel';
import AudioButton from '../components/AudioButton';
import ReadingModeBar from '../components/ReadingModeBar';
import VerseText from '../components/VerseText';
import { UrduAyahButton, UrduPlayAll } from '../components/UrduAudio';
import SpeedControl from '../components/SpeedControl';
import { saveProgress } from '../readingProgress';

export default function SurahDetail() {
  const { surahId } = useParams();
  const [searchParams] = useSearchParams();
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

  // Jump to the ayah in ?ayah=N once verses have loaded (used by "Continue reading").
  useEffect(() => {
    const target = searchParams.get('ayah');
    if (!target || verses.length === 0) return;
    const el = document.getElementById(`ayah-${target}`);
    if (el) el.scrollIntoView({ block: 'start' });
  }, [verses, searchParams]);

  // Remember the ayah near the top of the screen as the reader scrolls.
  useEffect(() => {
    if (verses.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            saveProgress(entry.target.dataset.surah, Number(entry.target.dataset.ayah));
          }
        });
      },
      { rootMargin: '0px 0px -70% 0px' }
    );
    document.querySelectorAll('[data-ayah]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [verses]);

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
      <ReadingModeBar showLanguage />
      <SpeedControl />
      <UrduPlayAll verses={verses} label="Play Urdu translation (whole surah)" />
      <UrduPlayAll verses={verses} mode="arabic" showCredit={false} label="Play full surah (Arabic)" />
      <UrduPlayAll verses={verses} mode="both" label="Arabic then Urdu, ayah by ayah" />
      {loading && <p className="muted">Loading verses…</p>}
      {error && <p className="error-text">{error}</p>}

      {verses.map((verse) => (
        <div
          key={verse.id}
          id={`ayah-${verse.ayah_number}`}
          data-ayah={verse.ayah_number}
          data-surah={verse.surah_id}
          className="card"
          style={{ cursor: 'default', scrollMarginTop: '1rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="eyebrow">Ayah {verse.ayah_number}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <AudioButton surahId={verse.surah_id} ayahNumber={verse.ayah_number} />
              <UrduAyahButton surahId={verse.surah_id} ayahNumber={verse.ayah_number} />
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
          <VerseText verse={verse} />
          <TafsirPanel verseId={verse.id} />
        </div>
      ))}
    </div>
  );
}