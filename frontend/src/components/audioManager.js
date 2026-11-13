// Makes sure only one audio clip plays at a time across the whole app
// (Arabic recitation, Urdu ayah audio, play-through), and keeps one shared
// playback speed for all of them.
let current = null;

const SPEED_KEY = 'audio_speed';
const ALLOWED = [0.75, 1, 1.25, 1.5];
let speed = 1;
try {
  const saved = parseFloat(localStorage.getItem(SPEED_KEY));
  if (ALLOWED.includes(saved)) speed = saved;
} catch {
  /* storage unavailable: default speed */
}

function applySpeed(audio) {
  audio.defaultPlaybackRate = speed; // survives changing audio.src in play-through
  audio.playbackRate = speed;
}

export function getSpeed() {
  return speed;
}

export function setSpeed(next) {
  speed = next;
  try {
    localStorage.setItem(SPEED_KEY, String(next));
  } catch {
    /* ignore */
  }
  if (current) applySpeed(current.audio);
}

export function claimAudio(audio, onStop) {
  if (current && current.audio !== audio) {
    current.audio.pause();
    current.onStop();
  }
  current = { audio, onStop };
  applySpeed(audio);
}

export function releaseAudio(audio) {
  if (current && current.audio === audio) current = null;
}