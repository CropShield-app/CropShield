import i18n from 'i18next';
import raw from './i18n/languages.json';
import { db } from './db.js';
import { addExtraWeeds } from './weeds.js';

// languages.json may be a list [{code,name,native,reviewed}] or an object { te: {name,native} }
const asList = Array.isArray(raw)
  ? raw
  : Object.entries(raw || {}).map(([code, v]) => ({ code, ...(v && typeof v === 'object' ? v : { name: String(v) }) }));
const base = asList
  .filter((l) => l && l.code)
  .map((l) => ({ code: l.code, name: l.name || l.code, native: l.native || l.name || l.code, reviewed: l.reviewed !== false }));

// A language pack file looks like:
// { "code": "ta", "name": "Tamil", "native": "தமிழ்", "strings": { ...same keys as en.json... },
//   "weeds": { "weed_id": { "name": "", "advice": "", "methods": [], "caution": "" } } }
function applyPack(p) {
  i18n.addResourceBundle(p.code, 'translation', p.strings || {}, true, true);
  if (p.weeds) addExtraWeeds(p.code, p.weeds);
}

export async function loadSavedPacks() {
  try {
    for (const p of await db.packs.toArray()) applyPack(p);
  } catch (e) {
    console.warn('Could not load saved language packs', e);
  }
}

export async function importPack(file) {
  const p = JSON.parse(await file.text());
  if (!p.code || !p.name || !p.strings) throw new Error('Not a language pack');
  await db.packs.put(p);
  applyPack(p);
  return p;
}

export async function allLanguages() {
  const map = new Map(base.map((l) => [l.code, l]));
  // any language file that exists in src/i18n shows up, even if languages.json forgot it
  Object.keys(i18n.store?.data || {}).forEach((code) => {
    if (!map.has(code)) map.set(code, { code, name: code, native: code, reviewed: false });
  });
  try {
    (await db.packs.toArray()).forEach((p) =>
      map.set(p.code, { code: p.code, name: p.name, native: p.native || p.name, reviewed: !!p.reviewed })
    );
  } catch (e) {}
  return [...map.values()];
}

export function setLanguage(code) {
  localStorage.setItem('lang', code);
  return i18n.changeLanguage(code);
}