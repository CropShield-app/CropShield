// Language codes the browser understands for voices and listening.
const codes = {
  en: 'en-IN', te: 'te-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', kn: 'kn-IN', mr: 'mr-IN',
  ml: 'ml-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-IN', as: 'as-IN'
};
export const langTag = (lang) => codes[String(lang || 'en').slice(0, 2)] || lang;

const hasTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
// Android reports "hi_IN", desktop reports "hi-IN". Treat both the same.
const norm = (s) => String(s || '').toLowerCase().replace('_', '-');

// Phones and Chrome fill the voice list a moment AFTER the page opens. Wait for it (up to ~1.5 s).
function loadVoices(timeout = 1500) {
  return new Promise((resolve) => {
    if (!hasTTS()) return resolve([]);
    const have = speechSynthesis.getVoices();
    if (have.length) return resolve(have);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeout);
  });
}

// Best installed voice for a language: exact region first (te-IN), then any voice of that language.
// Bengali is often only installed as bn-BD (Bangladesh); that reads Indian Bengali fine, so it is accepted.
export function pickVoice(lang, voices = hasTTS() ? speechSynthesis.getVoices() : []) {
  const tag = norm(langTag(lang));
  const prefix = tag.slice(0, 2);
  const same = voices.filter((v) => norm(v.lang).startsWith(prefix));
  if (!same.length) return null;
  return same.find((v) => norm(v.lang) === tag) || same.find((v) => v.localService) || same[0];
}

export function hasVoice(lang) {
  return hasTTS() && !!pickVoice(lang);
}

// Long text is cut into short pieces. Chrome silently stops long utterances after about 15 seconds.
function pieces(text, max = 170) {
  const sentences = String(text).replace(/\s+/g, ' ').trim().match(/[^.!?।॥]+[.!?।॥]*/g) || [];
  const out = [];
  for (const s of sentences) {
    let rest = s.trim();
    while (rest.length > max) {
      let cut = rest.lastIndexOf(' ', max);
      if (cut < 40) cut = max;
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

let run = 0; // every call to speak() or stopSpeaking() starts a new run, so old pieces stop quietly

// speak(text, lang, onEnd, onNoVoice)
//   onEnd()      - finished, stopped by an error, or no voice
//   onNoVoice()  - this device has no voice for the language (so nothing can be read aloud)
export async function speak(text, lang, onEnd, onNoVoice) {
  const me = ++run;
  const end = () => { if (me === run && onEnd) onEnd(); };
  if (!hasTTS() || !text) return end();

  speechSynthesis.cancel();
  const voices = await loadVoices();
  if (me !== run) return undefined; // something newer started while we waited

  const voice = pickVoice(lang, voices);
  // Voice list is loaded but has nothing for this language: be honest instead of staying silent.
  if (!voice && voices.length) {
    if (onNoVoice) onNoVoice();
    return end();
  }

  const list = pieces(text);
  let i = 0;
  const next = () => {
    if (me !== run) return;
    if (i >= list.length) return end();
    const u = new SpeechSynthesisUtterance(list[i++]);
    u.lang = voice ? voice.lang : langTag(lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = next;
    u.onerror = (e) => { if (e.error === 'canceled' || e.error === 'interrupted') return; end(); };
    window.__cropshieldUtterance = u; // keep a reference, or Chrome may drop the "end" event
    speechSynthesis.speak(u);
  };
  setTimeout(next, 80); // Chrome ignores speak() called right after cancel()
  return undefined;
}

export function stopSpeaking() {
  run++;
  if (hasTTS()) speechSynthesis.cancel();
}
