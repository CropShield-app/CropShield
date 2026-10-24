import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { weeds, weedText, weedLang, allTexts } from '../weeds.js';
import { buildIndex, resolve, sections } from '../askEngine.js';
import { speak, stopSpeaking, hasVoice } from '../speech.js';
import { db } from '../db.js';
import VoiceInput from './VoiceInput.jsx';

// Offline "AI helper": works out WHICH weed you mean and WHAT you want to know, then answers from the local weed data.
export default function AskBox() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [ans, setAns] = useState(null); // { weed, intent, usedContext, choices } or null before the first question
  const [speaking, setSpeaking] = useState(false);
  const [noVoice, setNoVoice] = useState(false);

  // Rebuilt when the language changes or a language pack is imported
  const index = useMemo(() => buildIndex(weeds, allTexts), [i18n.language, i18n.store?.data]);

  async function ask(text, forceWeedId) {
    stopSpeaking(); setSpeaking(false); setNoVoice(false);
    setQ(text);
    let ctx = forceWeedId || null;
    if (!ctx) {
      // the weed from the most recent scan, so "How to remove it?" knows what "it" is
      try { ctx = (await db.scans.orderBy('time').last())?.label || null; } catch (e) { ctx = null; }
    }
    const r = resolve(index, text, ctx);
    if (forceWeedId) {
      const w = weeds.find((x) => x.id === forceWeedId);
      setAns({ weed: w, intent: r.intent, usedContext: false, choices: [] });
    } else {
      setAns(r);
    }
  }

  const tx = ans?.weed ? weedText(ans.weed, i18n.language) : null;
  const parts = tx ? sections(tx, ans.intent) : [];
  const unclear = ans && !ans.weed;

  function listen() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = parts.map((p) => t(p.key) + '. ' + (Array.isArray(p.value) ? p.value.join('. ') : p.value)).join(' ');
    const lang = weedLang(ans.weed, i18n.language);
    setSpeaking(true);
    speak(tx.name + '. ' + text, lang, () => setSpeaking(false), () => setNoVoice(true));
  }

  return (
    <section className="card">
      <p className="lbl">{t('ask.title')}</p>
      {weeds.length === 0 && <p className="note">{t('ask.noData')}</p>}
      <div className="row">
        <input className="grow" value={q} placeholder={t('ask.placeholder')}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(q)} />
        <button className="chip primary" onClick={() => ask(q)}>{t('ask.search')}</button>
      </div>
      <VoiceInput onText={setQ} onDone={(text) => ask(text)} />
      <div className="row wrap">
        <button className="chip small" onClick={() => ask(t('ask.q1'))}>{t('ask.q1')}</button>
        <button className="chip small" onClick={() => ask(t('ask.q2'))}>{t('ask.q2')}</button>
      </div>

      {unclear && <p>{ans.intent ? t('ask.which') : t('ask.noMatch')}</p>}
      {(unclear || (ans?.weed && ans.choices.length > 1)) && (
        <div className="row wrap">
          {(unclear ? ans.choices : ans.choices).map((w) => (
            <button key={w.id} className="chip small" onClick={() => ask(q, w.id)}>{weedText(w, i18n.language).name}</button>
          ))}
        </div>
      )}

      {tx && (
        <div>
          <h3>{tx.name}</h3>
          {ans.usedContext && <p className="lbl">{t('ask.usingScan')}</p>}
          {parts.map((p) => (
            <div key={p.key}>
              <p className="lbl">{t(p.key)}</p>
              {Array.isArray(p.value)
                ? <ul>{p.value.map((m) => <li key={m}>{m}</li>)}</ul>
                : <p>{p.value}</p>}
            </div>
          ))}
          <button className="chip" onClick={listen}>{speaking ? t('scan.stop') : t('scan.listen')}</button>
          {(noVoice || !hasVoice(weedLang(ans.weed, i18n.language))) && <p className="lbl">{t('scan.noVoice')}</p>}
        </div>
      )}
    </section>
  );
}
