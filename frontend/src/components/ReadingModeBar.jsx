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
const selectStyle = {
  width: 'auto',
  flex: '1 1 10rem',
  padding: '0.5em 0.8em',
  fontSize: '0.9rem',
  colorScheme: 'dark',
  cursor: 'pointer',
};

// showLanguage: also show the English / Urdu choice. Only the Quran pages pass it,
// because hadith data is English only.
export default function ReadingModeBar({ showLanguage = false }) {
  const { settings, updateSetting } = useReading();

  return (
    <div style={rowStyle}>
      <select
        aria-label="What to show"
        className="btn-secondary"
        style={selectStyle}
        value={settings.mode}
        onChange={(e) => updateSetting('mode', e.target.value)}
      >
        {MODES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showLanguage && settings.mode !== 'arabic' && (
        <select
          aria-label="Translation language"
          className="btn-secondary"
          style={selectStyle}
          value={settings.translation}
          onChange={(e) => updateSetting('translation', e.target.value)}
        >
          {LANGS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}