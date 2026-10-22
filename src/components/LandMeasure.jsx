import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFix, areaSqM, toAcres } from '../geo.js';

// Walk to each corner of the field and tap "Add corner". Works with GPS only, no internet.
export default function LandMeasure({ onUse }) {
  const { t } = useTranslation();
  const [points, setPoints] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function addCorner() {
    setBusy(true); setErr('');
    try {
      const fix = await getFix();
      setPoints((p) => [...p, fix]);
    } catch (e) {
      setErr(t('land.gpsFailed'));
    }
    setBusy(false);
  }

  const acres = toAcres(areaSqM(points));
  const worst = points.reduce((m, p) => Math.max(m, p.accuracy), 0);

  return (
    <section className="card">
      <p className="lbl">{t('land.title')}</p>
      <p className="lbl">{t('land.hint')}</p>
      <div className="row wrap">
        <button className="chip primary" onClick={addCorner} disabled={busy}>{busy ? '...' : t('land.addCorner')}</button>
        <button className="chip" onClick={() => setPoints((p) => p.slice(0, -1))} disabled={!points.length}>{t('land.undo')}</button>
        <button className="chip" onClick={() => setPoints([])} disabled={!points.length}>{t('land.clear')}</button>
      </div>
      {err && <p className="err">{err}</p>}
      <p>{t('land.corners', { n: points.length })}</p>
      {points.length >= 3 && (
        <>
          <h3>{acres.toFixed(2)} {t('farm.acres')}</h3>
          {worst > 15 && <p className="note">{t('land.lowAccuracy', { m: Math.round(worst) })}</p>}
          <button className="chip" onClick={() => onUse(acres.toFixed(2))}>{t('land.use')}</button>
        </>
      )}
    </section>
  );
}
