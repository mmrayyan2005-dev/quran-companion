import { useReading } from '../context/ReadingContext';

const OPTIONS = [
  { value: 'both', label: 'Arabic + Translation' },
  { value: 'arabic', label: 'Arabic only' },
  { value: 'translation', label: 'Translation only' },
];

export default function ReadingModeBar() {
  const { settings, updateSetting } = useReading();

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={settings.mode === opt.value ? 'btn' : 'btn-secondary'}
          style={{ width: 'auto', padding: '0.4em 1em', fontSize: '0.85rem' }}
          onClick={() => updateSetting('mode', opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
