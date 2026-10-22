// weeds.json is made by Person 3 (python make_json.py). If it is missing, the list is empty.
const mods = import.meta.glob('./data/weeds.json', { eager: true });
export const weeds = Object.values(mods)[0]?.default ?? [];

const extra = {}; // advice text from imported language packs
export function addExtraWeeds(code, map) {
  extra[code] = map;
}

export function weedText(weed, lang) {
  return (
    extra[lang]?.[weed.id] ||
    weed.text?.[lang] ||
    weed.text?.en || { name: weed.id, advice: '', methods: [], caution: '' }
  );
}

export function findWeed(id) {
  return weeds.find((w) => w.id === id);
}

// The language the text really comes in. If a weed has no text in the chosen language,
// the English text is shown, so it must also be READ in English.
export function weedLang(weed, lang) {
  if (extra[lang]?.[weed.id]) return lang;
  return weed.text?.[lang] ? lang : 'en';
}
