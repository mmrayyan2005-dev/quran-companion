import { useReading } from '../context/ReadingContext';

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
      {showArabic && <p className="arabic-text">{verse.text_arabic}</p>}
      {showUrdu && <p className="urdu-text">{verse.text_translation_ur}</p>}
      {showEnglish && <p>{verse.text_translation_en}</p>}
    </>
  );
}
