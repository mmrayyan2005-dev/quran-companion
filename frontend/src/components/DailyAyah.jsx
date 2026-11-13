import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import VerseText from './VerseText';

// [surahId, ayahNumber]. Add or remove pairs freely; the day's pick rotates through the list.
const PICKS = [
  [94, 5],
  [94, 6],
  [13, 28],
  [65, 3],
  [39, 53],
  [3, 139],
  [2, 152],
  [2, 153],
  [2, 186],
  [2, 286],
  [14, 7],
  [55, 13],
  [93, 3],
  [29, 69],
  [40, 60],
  [3, 173],
  [49, 13],
  [112, 1],
  [2, 255],
];

function todaysPick() {
  const d = new Date();
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return PICKS[day % PICKS.length];
}

export default function DailyAyah() {
  const [verse, setVerse] = useState(null);
  const [surahName, setSurahName] = useState('');

  useEffect(() => {
    const [surahId, ayahNumber] = todaysPick();
    let cancelled = false;
    Promise.all([api.getSurahVerses(surahId), api.listSurahs()])
      .then(([verses, surahs]) => {
        if (cancelled) return;
        const v = verses.find((x) => x.ayah_number === ayahNumber);
        const s = surahs.find((x) => x.id === surahId);
        if (v) setVerse(v);
        if (s) setSurahName(s.name_transliteration);
      })
      .catch(() => {
        /* no card if it can't load; the rest of the home page is unaffected */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!verse) return null;

  return (
    <div className="card" style={{ cursor: 'default', margin: '1rem 0' }}>
      <span className="eyebrow">Ayah of the day</span>
      <VerseText verse={verse} />
      <Link
        to={`/surah/${verse.surah_id}?ayah=${verse.ayah_number}`}
        className="muted"
        style={{ fontSize: '0.85rem' }}
      >
        {surahName || `Surah ${verse.surah_id}`} · Ayah {verse.ayah_number} — read in context &rarr;
      </Link>
    </div>
  );
}