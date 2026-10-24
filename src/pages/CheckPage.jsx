import { useEffect, useState } from 'react';
import i18n from 'i18next';
import { modelStatus } from '../classify.js';
import { weeds } from '../weeds.js';

// A page that tells you exactly what is missing. Open it from the "Setup check" link, or go to /#/check
async function probe(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return { ok: false, note: 'missing (' + r.status + ')' };
    if ((r.headers.get('content-type') || '').includes('text/html')) return { ok: false, note: 'missing (got a web page instead)' };
    return { ok: true, note: 'found', response: r };
  } catch (e) {
    return { ok: false, note: 'could not be read' };
  }
}

const flat = (d, p = '') => Object.entries(d || {}).reduce((o, [k, v]) =>
  (v && typeof v === 'object' ? { ...o, ...flat(v, p + k + '.') } : { ...o, [p + k]: v }), {});

export default function CheckPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const out = [];
      const add = (name, ok, note) => out.push({ name, ok, note });
      const base = import.meta.env.BASE_URL + 'model/';

      const mj = await probe(base + 'model.json');
      add('public/model/model.json', mj.ok, mj.note);
      if (mj.ok) {
        const info = await mj.response.json().catch(() => null);
        const paths = (info?.weightsManifest || []).flatMap((g) => g.paths || []);
        if (!paths.length) add('weight files listed in model.json', false, 'none listed. model.json looks wrong');
        for (const p of paths) {
          const r = await probe(base + p);
          add('public/model/' + p, r.ok, r.ok ? 'found' : r.note + '. Copy EVERY .bin file, with the exact name');
        }
      }
      const lj = await probe(base + 'labels.json');
      add('public/model/labels.json', lj.ok, lj.note);
      const mi = await probe(base + 'model_info.json');
      if (mi.ok) {
        const d = await mi.response.json().catch(() => ({}));
        add('public/model/model_info.json', true, 'pixelScale ' + d.pixelScale + (d.testAccuracy ? ', test accuracy ' + Math.round(d.testAccuracy * 1000) / 10 + '%' : ''));
      } else {
        add('public/model/model_info.json', false, 'missing. It must be in public/model/ next to model.json (not in src)');
      }

      const st = await modelStatus();
      add('the AI model loads', st.ok, st.ok ? st.labels.length + ' weeds, scale ' + st.scale : st.error || 'not loaded');

      add('src/data/weeds.json', weeds.length > 0, weeds.length ? weeds.length + ' weeds: ' + weeds.map((w) => w.id).join(', ') : 'missing or empty. Put weeds.json in src/data/');
      if (st.ok && weeds.length) {
        const ids = weeds.map((w) => w.id);
        const lost = st.labels.filter((l) => !ids.includes(l));
        add('weed ids match the model labels', lost.length === 0, lost.length ? 'no weeds.json entry for: ' + lost.join(', ') : 'all match');
      }
      if (weeds.length) {
        const w = weeds[0];
        const ok = !!(w.text.en && w.text.en.name && w.text.en.advice);
        add('weeds.json has English name and advice', ok, ok ? 'yes' : 'not found. Show the first weed to your helper');
      }

      const data = i18n.store?.data || {};
      const en = flat(data.en?.translation);
      Object.keys(data).forEach((lang) => {
        const mine = flat(data[lang]?.translation);
        const missing = Object.keys(en).filter((k) => !(k in mine)).length;
        const withText = weeds.filter((w) => w.text[lang]).length;
        add('language ' + lang, missing === 0, missing ? missing + ' app words missing' : 'all app words present') ;
        if (weeds.length) add('   weed advice in ' + lang, withText === weeds.length, withText + ' of ' + weeds.length + ' weeds');
      });
      setRows(out);
    })();
  }, []);

  return (
    <section className="card">
      <p className="lbl">Setup check</p>
      {rows.length === 0 && <p>Checking...</p>}
      {rows.map((r, i) => (
        <p key={i} className={r.ok ? '' : 'note'}>
          <b>{r.ok ? 'OK' : 'PROBLEM'}</b> {r.name}: {r.note}
        </p>
      ))}
      <p className="lbl">A PROBLEM line says what to fix. Fix it, then reload this page.</p>
    </section>
  );
}
