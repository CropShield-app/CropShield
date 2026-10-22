import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import { weeds, weedText, weedLang, findWeed } from '../weeds.js';
import { speak } from '../speech.js';
import VoiceInput from './VoiceInput.jsx';

// Offline "AI helper": matches the question to the closest weed in the local knowledge base.
export default function AskBox() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [hit, setHit] = useState(undefined); // undefined = not asked, null = no match

  const fuse = useMemo(() => {
    const docs = weeds.map((w) => {
      const x = weedText(w, i18n.language);
      const e = weedText(w, 'en');
      return { id: w.id, text: [x.name, x.advice, x.methods.join(' '), e.name, e.advice].join(' ') };
    });
    return new Fuse(docs, { keys: ['text'], threshold: 0.5, ignoreLocation: true });
  }, [i18n.language]);

  function ask(text) {
    setQ(text);
    const r = fuse.search(text)[0];
    setHit(r ? findWeed(r.item.id) : null);
  }

  const tx = hit ? weedText(hit, i18n.language) : null;

  return (
    <section className="card">
      <p className="lbl">{t('ask.title')}</p>
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
      {hit === null && <p>{t('ask.noMatch')}</p>}
      {tx && (
        <div>
          <h3>{tx.name}</h3>
          <p>{tx.advice}</p>
          <button className="chip" onClick={() => speak(tx.name + '. ' + tx.advice, weedLang(hit, i18n.language))}>{t('scan.listen')}</button>
        </div>
      )}
    </section>
  );
}
