// Offline question answering for the AI helper. No internet, no model: it works from weeds.json.
// 1. Find WHICH weed the question is about (names in every language, scientific name, common local names,
//    or words from the descriptions).  2. Find WHAT is asked (what is it / how to remove / is it dangerous).
// 3. Answer with only the part that was asked. If the weed is unclear, ask which one instead of guessing.

const ALIASES = {
  cyperus_rotundus: ['nutgrass', 'nut grass', 'nutsedge', 'nut sedge', 'purple nutsedge', 'purple sedge', 'motha', 'mutha', 'nagarmotha', 'nagar motha', 'cyperus'],
  cynodon_dactylon: ['bermuda', 'bermuda grass', 'doob', 'dhoob', 'durva', 'durba', 'dubo', 'garika', 'hariyali', 'cynodon'],
  echinochloa_colona: ['jungle rice', 'junglerice', 'sawank', 'sanwa', 'echinochloa', 'barnyard grass'],
  parthenium: ['parthenium', 'congress grass', 'congress weed', 'carrot grass', 'carrot weed', 'gajar ghas', 'gajar grass', 'vayyari bhama', 'feverfew'],
  trianthema_portulacastrum: ['horse purslane', 'desert horse purslane', 'trianthema', 'giant pigweed']
};

// Words that say WHAT the person wants (English + Hindi + Telugu + Bengali stems)
const INTENTS = {
  control: ['remove', 'removal', 'control', 'kill', 'get rid', 'manage', 'treat', 'destroy', 'eliminate', 'stop', 'prevent', 'weeding', 'spray', 'herbicide', 'uproot', 'clear', 'cure', 'solution', 'how to', 'how do', 'how can',
    'हटा', 'नियंत्र', 'खत्म', 'निराई', 'नष्ट', 'इलाज', 'उपाय', 'कैसे', 'तोड़',
    'తొలగ', 'నియంత్ర', 'నిర్మూల', 'ఎలా', 'తీయ', 'నివార',
    'দূর', 'নিয়ন্ত্রণ', 'নিয়ন্ত্রন', 'কীভাবে', 'কিভাবে', 'পরিষ্কার', 'নির্মূল', 'উপায়'],
  danger: ['danger', 'dangerous', 'harm', 'harmful', 'safe', 'safety', 'allerg', 'toxic', 'poison', 'touch', 'skin', 'careful', 'caution', 'warning', 'risk', 'itch', 'health',
    'खतर', 'एलर्जी', 'नुकसान', 'सावधान', 'जहर', 'छू', 'त्वचा',
    'ప్రమాద', 'అలర్జీ', 'జాగ్రత్త', 'విష', 'హాని', 'తాక',
    'বিপদ', 'বিপজ্জনক', 'অ্যালার্জি', 'সাবধান', 'ক্ষতি', 'বিষ', 'ছোঁ'],
  regrow: ['regrow', 'come back', 'comes back', 'again', 'spread', 'return', 'tuber', 'runner',
    'दोबारा', 'फैल', 'फिर',
    'మళ్లీ', 'వ్యాప', 'తిరిగి',
    'আবার', 'ছড়ি', 'ফিরে'],
  about: ['what', 'identify', 'look', 'describe', 'which', 'about', 'tell', 'explain', 'name', 'who',
    'क्या', 'पहचान', 'बताओ', 'बताइए', 'कौन',
    'ఏమిటి', 'ఏంటి', 'గుర్తించ', 'చెప్పు', 'ఏది',
    'কী', 'কি ', 'চেনা', 'পরিচয়', 'বলুন', 'কোন']
};

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'it', 'this', 'that', 'to', 'of', 'in', 'on', 'my', 'me', 'i', 'and', 'or', 'for', 'with', 'how', 'what', 'do', 'can', 'does', 'weed', 'weeds', 'plant', 'about', 'tell', 'please', 'field', 'crop', 'grass', 'sedge', 'rice', 'ghas', 'घास']);

const INTENT_WORDS = new Set(Object.values(INTENTS).flat().map((w) => w.trim()).filter((w) => !w.includes(' ')));
const norm = (s) => String(s || '').normalize('NFC').toLowerCase();
const tokens = (s) => norm(s).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
const stem = (t) => (/^[a-z]+$/.test(t) && t.length > 4 ? t.replace(/(ing|ed|es|s)$/, '') : t);

// Same word, allowing endings ("సైన్స్" vs "సైన్స్‌ను", "weeds" vs "weed")
function same(a, b) {
  a = stem(a); b = stem(b);
  if (a === b) return true;
  const m = Math.min(a.length, b.length);
  return m >= 3 && (a.startsWith(b) || b.startsWith(a));
}

function variants(name) {
  return String(name || '').split(/[()/,;]/).map((x) => x.trim()).filter(Boolean);
}

export function buildIndex(weeds, textsOf) {
  const docs = weeds.map((w) => {
    const names = new Set();
    const body = [];
    for (const o of Object.values(textsOf(w))) {
      variants(o.name).forEach((v) => names.add(v));
      body.push(o.advice, ...(o.methods || []), o.caution);
    }
    if (w.scientific) names.add(w.scientific);
    names.add(w.id.replace(/_/g, ' '));
    (ALIASES[w.id] || []).forEach((a) => names.add(a));
    const nameList = [...names].map((n) => tokens(n)).filter((t) => t.length);
    return { id: w.id, weed: w, nameList, body: tokens(body.join(' ')) };
  });
  const df = {};
  docs.forEach((d) => new Set(d.body.map(stem)).forEach((t) => { df[t] = (df[t] || 0) + 1; }));
  return { docs, df, n: docs.length };
}

export function detectIntent(q) {
  const s = ' ' + norm(q) + ' ';
  for (const k of ['danger', 'regrow', 'control', 'about']) {
    if (INTENTS[k].some((w) => s.includes(w))) return k;
  }
  return null;
}

// Which weed names are in the question? A name counts only if ALL its words are present.
function nameScores(index, qTokens) {
  return index.docs.map((d) => {
    let best = 0;
    for (const nt of d.nameList) {
      const hit = nt.filter((w) => qTokens.some((q) => same(q, w)));
      if (hit.length === nt.length && !(nt.length === 1 && STOP.has(nt[0]))) best = Math.max(best, nt.length + 2);
    }
    return best;
  });
}

// Description search ("reddish flowers", "deeply divided leaves")
function bodyScores(index, qTokens) {
  const words = qTokens.filter((t) => !STOP.has(t) && t.length > 2 && ![...INTENT_WORDS].some((w) => t.startsWith(w) || w.startsWith(t)));
  return index.docs.map((d) => {
    let s = 0;
    for (const w of new Set(words)) {
      if (d.body.some((b) => same(b, w))) s += Math.log(1 + index.n / (index.df[stem(w)] || 1));
    }
    return s;
  });
}

// Returns { weed, intent, usedContext, choices }.
//   weed    - the weed to answer about (or null)
//   choices - weeds to offer when the question is unclear or several fit
export function resolve(index, question, contextId) {
  const q = tokens(question);
  const intent = detectIntent(question);
  const byName = nameScores(index, q);
  const topName = Math.max(...byName, 0);

  if (topName > 0) {
    const hits = index.docs.filter((_, i) => byName[i] === topName);
    const pick = hits.find((d) => d.id === contextId) || hits[0];
    return { weed: pick.weed, intent, usedContext: false, choices: hits.length > 1 ? hits.map((h) => h.weed) : [] };
  }

  const byBody = bodyScores(index, q);
  const topBody = Math.max(...byBody, 0);
  if (topBody >= 1.2) {
    const ranked = index.docs.map((d, i) => ({ d, s: byBody[i] })).filter((x) => x.s >= topBody * 0.6).sort((a, b) => b.s - a.s);
    return { weed: ranked[0].d.weed, intent, usedContext: false, choices: ranked.length > 1 ? ranked.map((x) => x.d.weed) : [] };
  }

  // "What is this weed?" / "How to remove it?" has no name: use the weed from the last scan
  const ctx = index.docs.find((d) => d.id === contextId);
  if (ctx && intent) return { weed: ctx.weed, intent, usedContext: true, choices: [] };

  return { weed: null, intent, usedContext: false, choices: index.docs.map((d) => d.weed) };
}

// Pick the parts of the entry that answer the question. Labels are i18n keys.
export function sections(text, intent) {
  const out = [];
  const add = (key, v) => v && (Array.isArray(v) ? v.length : String(v).trim()) && out.push({ key, value: v });
  if (intent === 'control') { add('ask.secControl', text.methods); add('ask.secCaution', text.caution); }
  else if (intent === 'danger') { add('ask.secCaution', text.caution); add('ask.secControl', text.methods); }
  else if (intent === 'regrow') { add('ask.secCaution', text.caution); add('ask.secAbout', text.advice); }
  else { add('ask.secAbout', text.advice); add('ask.secControl', text.methods); add('ask.secCaution', text.caution); }
  return out;
}
