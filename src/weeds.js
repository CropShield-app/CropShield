// weeds.json is made by Person 3. If it is missing, the list is empty.
// This file accepts a few layouts, so a slightly different weeds.json cannot crash the app:
//   A) { id, text: { en: { name, advice, methods: [], caution }, te: {...} } }
//   B) flat columns: { id, name_en, advice_en, methods_en, caution_en, name_te, ... }
//   and the whole file may be a list, { "weeds": [...] }, or an object keyed by id.
const mods = import.meta.glob('./data/weeds.json', { eager: true });
const raw = Object.values(mods)[0]?.default ?? [];

const key = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const str = (v) => (Array.isArray(v) ? v.join('. ') : String(v ?? '')).trim();
const items = (v) => (Array.isArray(v) ? v.map(String) : String(v ?? '').split(/\||\n/)).map((s) => s.trim()).filter(Boolean);

function cleanText(o) {
  return {
    name: str(o.name ?? o.title),
    advice: str(o.advice ?? o.description),
    methods: items(o.methods ?? o.control ?? o.steps),
    caution: str(o.caution ?? o.warning)
  };
}

function normalise(w) {
  const text = {};
  const nested = w.text || w.translations || w.languages || null;
  if (nested && typeof nested === 'object') {
    for (const [lang, o] of Object.entries(nested)) if (o && typeof o === 'object') text[lang] = o;
  }
  for (const k of Object.keys(w)) {
    const m = k.match(/^(name|advice|methods|caution)_([a-z]{2,3})$/);
    if (m) { text[m[2]] = text[m[2]] || {}; text[m[2]][m[1]] = w[k]; }
  }
  if (!text.en && (w.name || w.advice)) text.en = w;
  for (const lang of Object.keys(text)) text[lang] = cleanText(text[lang]);
  const scientific = String(w.scientific_name ?? w.scientific ?? '').split(/\s+[—–-]\s+/)[0].trim();
  return { id: String(w.id ?? w.label ?? w.slug ?? ''), scientific, source: w.source || '', text };
}

const list = Array.isArray(raw) ? raw
  : Array.isArray(raw.weeds) ? raw.weeds
  : Object.entries(raw).map(([id, v]) => ({ id, ...(v && typeof v === 'object' ? v : {}) }));
export const weeds = list.map(normalise).filter((w) => w.id);

const extra = {}; // advice text from imported language packs
export function addExtraWeeds(code, map) {
  extra[code] = {};
  for (const [id, o] of Object.entries(map || {})) extra[code][id] = cleanText(o || {});
}

export function weedText(weed, lang) {
  return (
    extra[lang]?.[weed.id] ||
    weed.text?.[lang] ||
    weed.text?.en || { name: weed.id, advice: '', methods: [], caution: '' }
  );
}
export function allTexts(weed) {
  const out = { ...(weed.text || {}) };
  for (const code of Object.keys(extra)) if (extra[code][weed.id]) out[code] = extra[code][weed.id];
  return out;
}

// Matches ids loosely, so "Cynodon dactylon" and "cynodon_dactylon" are the same weed.
export function findWeed(id) {
  return weeds.find((w) => key(w.id) === key(id));
}

// The language the text really comes in. If a weed has no text in the chosen language,
// the English text is shown, so it must also be READ in English.
export function weedLang(weed, lang) {
  if (extra[lang]?.[weed.id]) return lang;
  return weed.text?.[lang] ? lang : 'en';
}