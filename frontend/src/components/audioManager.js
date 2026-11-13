// Makes sure only one audio clip plays at a time across the whole app
// (Arabic recitation, Urdu ayah audio, Urdu play-through).
let current = null;

export function claimAudio(audio, onStop) {
  if (current && current.audio !== audio) {
    current.audio.pause();
    current.onStop();
  }
  current = { audio, onStop };
}

export function releaseAudio(audio) {
  if (current && current.audio === audio) current = null;
}
