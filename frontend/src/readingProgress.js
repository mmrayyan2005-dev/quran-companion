// Remembers the last ayah the reader was on, in this browser only.
const KEY = 'last_read';

export function saveProgress(surahId, ayahNumber) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ surahId: Number(surahId), ayahNumber, at: Date.now() }));
  } catch {
    /* storage unavailable: skip silently */
  }
}

export function getProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && p.surahId && p.ayahNumber) return p;
  } catch {
    /* ignore */
  }
  return null;
}