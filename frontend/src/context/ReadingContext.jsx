import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'reading_settings';

// Add new reading options here later (e.g. arabicSize, showTafsir) and they
// are saved automatically, with no other plumbing needed.
const DEFAULTS = {
  mode: 'both', // 'both' | 'arabic' | 'translation'
};

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return DEFAULTS;
  }
}

const ReadingContext = createContext(null);

export function ReadingProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: setting still works for this session */
      }
      return next;
    });
  }, []);

  return (
    <ReadingContext.Provider value={{ settings, updateSetting }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading must be used within a ReadingProvider');
  return ctx;
}
