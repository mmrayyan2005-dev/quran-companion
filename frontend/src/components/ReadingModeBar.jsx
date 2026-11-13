import { useReading } from '../context/ReadingContext';

const MODES = [
  { value: 'both', label: 'Arabic + Translation' },
  { value: 'arabic', label: 'Arabic only' },
  { value: 'translation', label: 'Translation only' },
];

const LANGS = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو (Urdu)' },
  { value: 'both', label: 'English + Urdu' },
];

const rowStyle = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0' };
const btnStyle = { width: 'auto', padding: '0.4em 1em', fontSize: '0.85rem' };

// showLanguage: also show the English / Urdu choice. Only the Quran pages pass it,
// because hadith data is English only.
export default function ReadingModeBar({ showLanguage = false }) {
  const { settings, updateSetting } = useReading();

  return (
    <div>
      <div style={rowStyle}>
        {MODES.map((opt) => (
          <button
            key={opt.value}
            className={settings.mode === opt.value ? 'btn' : 'btn-secondary'}
            style={btnStyle}
            onClick={() => updateSetting('mode', opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {showLanguage && settings.mode !== 'arabic' && (
        <div style={rowStyle}>
          {LANGS.map((opt) => (
            <button
              key={opt.value}
              className={settings.translation === opt.value ? 'btn' : 'btn-secondary'}
              style={btnStyle}
              onClick={() => updateSetting('translation', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
