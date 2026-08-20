import { useState } from 'react';
import { api } from '../api/client';

export default function TafsirPanel({ verseId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState(null); // null = not yet fetched
  const [activeSource, setActiveSource] = useState(null);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (entries !== null) return; // already fetched, just re-showing

    setLoading(true);
    setError(null);
    try {
      const data = await api.getVerseTafsir(verseId);
      setEntries(data);
      if (data.length > 0) setActiveSource(data[0].source_name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const active = entries?.find((e) => e.source_name === activeSource);

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        className="btn-secondary"
        style={{ width: 'auto', padding: '0.3em 0.8em', fontSize: '0.8rem', borderRadius: '999px' }}
        onClick={handleToggle}
      >
        {open ? 'Hide tafsir' : 'Tafsir'}
      </button>

      {open && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          {loading && <p className="muted">Loading tafsir…</p>}
          {error && <p className="error-text">{error}</p>}

          {entries !== null && entries.length === 0 && (
            <p className="muted">No tafsir available for this verse yet.</p>
          )}

          {entries && entries.length > 0 && (
            <>
              {entries.length > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {entries.map((e) => (
                    <button
                      key={e.source_name}
                      onClick={() => setActiveSource(e.source_name)}
                      className={e.source_name === activeSource ? 'btn' : 'btn-secondary'}
                      style={{
                        width: 'auto',
                        padding: '0.25em 0.7em',
                        fontSize: '0.75rem',
                        borderRadius: '999px',
                      }}
                    >
                      {e.source_name}
                    </button>
                  ))}
                </div>
              )}
              {active && (
                <div>
                  {entries.length === 1 && (
                    <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>{active.source_name}</p>
                  )}
                  <p style={{ whiteSpace: 'pre-line' }}>{active.text}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
