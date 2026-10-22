// Language codes the browser understands for voices and listening.
const codes = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', kn: 'kn-IN', mr: 'mr-IN' };
export const langTag = (lang) => codes[lang] || lang;

// Reading aloud uses the phone's own voices. Works offline if the voice is installed.
export function hasVoice(lang) {
  if (!('speechSynthesis' in window)) return false;
  const prefix = langTag(lang).slice(0, 2).toLowerCase();
  return speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(prefix));
}

let current = null; // the sentence being spoken right now

export function speak(text, lang, onEnd) {
  if (!('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return;
  }
  // Silence the old sentence's callbacks so they cannot confuse the screen
  if (current) { current.onend = null; current.onerror = null; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langTag(lang);
  u.onend = () => onEnd && onEnd();
  u.onerror = () => onEnd && onEnd();
  current = u;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (current) { current.onend = null; current.onerror = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
