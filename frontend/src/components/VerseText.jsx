import { useReading } from '../context/ReadingContext';
// Some Quran sources attach the Bismillah to the front of ayah 1 of every surah
// except Surah 1 (where it IS ayah 1) and Surah 9 (which has none).
// Strip it for display, and only when the verse really starts with it.
const MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g;

function cleanArabic(verse) {
  const text = verse.text_arabic || '';
  if (verse.ayah_number !== 1 || verse.surah_id === 1 || verse.surah_id === 9) return text;
  const words = text.trim().split(/\s+/);
  if (words.length > 4 && words[0].replace(MARKS, '') === 'بسم') {
    return words.slice(4).join(' ');
  }
  return text;
}

// Renders one verse's text according to the reader's choices:
//   mode: Arabic + Translation / Arabic only / Translation only
//   translation: English / Urdu / both
export default function VerseText({ verse }) {
  const { settings } = useReading();
  const showArabic = settings.mode !== 'translation';
  const showTranslation = settings.mode !== 'arabic';
  const lang = settings.translation;
  const hasUrdu = Boolean(verse.text_translation_ur);

  const showUrdu = showTranslation && (lang === 'ur' || lang === 'both') && hasUrdu;
  // If Urdu is chosen but this verse has no Urdu text yet, fall back to English
  // so the card is never empty.
  const showEnglish = showTranslation && (lang === 'en' || lang === 'both' || !hasUrdu);

  return (
    <>
      {showArabic && <p className="arabic-text">{cleanArabic(verse)}</p>}
      {showUrdu && <p className="urdu-text">{verse.text_translation_ur}</p>}
      {showEnglish && <p>{verse.text_translation_en}</p>}
    </>
  );
}
