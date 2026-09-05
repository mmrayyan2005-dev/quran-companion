/**
 * Central fetch wrapper. Every request to the backend goes through here —
 * one place that knows the base URL, attaches the auth token, and turns
 * non-2xx responses into thrown errors with a readable message.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getToken() {
  return localStorage.getItem('access_token');
}

async function request(path, { method = 'GET', body, auth = false, form = false } = {}) {
  const headers = {};
  if (!form) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        detail = typeof errJson.detail === 'string'
          ? errJson.detail
          : errJson.detail.map((d) => d.msg).join(', ');
      }
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  signup: (email, password) =>
    request('/api/v1/auth/signup', { method: 'POST', body: { email, password } }),

  login: (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return request('/api/v1/auth/login', { method: 'POST', body: form, form: true });
  },

  // Verses
  listSurahs: () => request('/api/v1/surahs'),
  getSurahVerses: (surahId) => request(`/api/v1/surahs/${surahId}/verses`),
  getJuzVerses: (juzNumber) => request(`/api/v1/juz/${juzNumber}/verses`),
  searchVerses: (q) => request(`/api/v1/verses/search?q=${encodeURIComponent(q)}`),
  getVerseTafsir: (verseId) => request(`/api/v1/verses/${verseId}/tafsir`),

  // Hadith
  listHadithCollections: () => request('/api/v1/hadith/collections'),
  listHadithBooks: (collectionKey) => request(`/api/v1/hadith/${collectionKey}/books`),
  browseHadithBook: (collectionKey, bookNumber, page = 1) =>
    request(`/api/v1/hadith/${collectionKey}/books/${bookNumber}?page=${page}&page_size=20`),
  browseHadithCollection: (collectionKey, page = 1) =>
    request(`/api/v1/hadith/${collectionKey}?page=${page}&page_size=20`),
  searchHadiths: (q) => request(`/api/v1/hadith/search/all?q=${encodeURIComponent(q)}`),

  // Bookmarks
  listBookmarks: () => request('/api/v1/bookmarks', { auth: true }),
  createBookmark: (verseId, note) =>
    request('/api/v1/bookmarks', { method: 'POST', auth: true, body: { verse_id: verseId, note } }),
  deleteBookmark: (bookmarkId) =>
    request(`/api/v1/bookmarks/${bookmarkId}`, { method: 'DELETE', auth: true }),

  // Memorization
  addToMemorization: (verseId) =>
    request(`/api/v1/memorization/add/${verseId}`, { method: 'POST', auth: true }),
  getDueReviews: () => request('/api/v1/memorization/due', { auth: true }),
  submitReview: (verseId, outcome) =>
    request('/api/v1/memorization/review', {
      method: 'POST',
      auth: true,
      body: { verse_id: verseId, outcome },
    }),
};
