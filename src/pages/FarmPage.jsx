import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { db } from '../db.js';
import { findWeed, weedText } from '../weeds.js';
import FieldGrid from '../components/FieldGrid.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import LandMeasure from '../components/LandMeasure.jsx';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

const STAGES = ['sowing', 'growing', 'flowering', 'harvest'];
const EMPTY = { id: 1, temp: '', rain: '', soil: '', water: '', land: '', crop: '', stage: '', window: '' };

export default function FarmPage() {
  const { t, i18n } = useTranslation();
  const [farm, setFarm] = useState(EMPTY);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState(0);

  // Read the saved scans from the phone again (also used by the Refresh button)
  function loadScans() {
    return db.scans.toArray().then((list) => {
      const c = {};
      list.forEach((s) => { c[s.label] = (c[s.label] || 0) + 1; });
      setCounts(c);
      setTotal(list.length);
      setLast(list.reduce((m, s) => Math.max(m, s.time || 0), 0));
    });
  }
  async function clearHistory() {
    if (window.confirm(t('farm.clearConfirm'))) {
      await db.scans.clear();
      loadScans();
    }
  }

  useEffect(() => {
    db.farm.get(1).then((f) => f && setFarm(f));
    loadScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every change is saved straight to the phone
  const set = (k, v) => {
    const next = { ...farm, [k]: v };
    setFarm(next);
    db.farm.put(next);
  };

  const field = (k, label) => (
    <label className="card">
      <span className="lbl">{label}</span>
      <input value={farm[k]} onChange={(e) => set(k, e.target.value)} />
    </label>
  );
  const pick = (k, label, opts) => (
    <label className="card">
      <span className="lbl">{label}</span>
      <select value={farm[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">-</option>
        {opts.map((o) => <option key={o} value={o}>{t('opt.' + o)}</option>)}
      </select>
    </label>
  );

  const labels = Object.keys(counts);

  return (
    <>
      <FieldGrid />
      <WeatherCard />
      <LandMeasure onUse={(acres) => set('land', acres)} />
      <div className="two">
        {field('temp', t('farm.weather') + ' (°C)')}
        {field('rain', t('farm.rain'))}
        {pick('soil', t('farm.soil'), ['clay', 'loam', 'sand', 'other'])}
        {pick('water', t('farm.water'), ['well', 'canal', 'rain', 'other'])}
        {field('land', t('farm.landArea') + ' (' + t('farm.acres') + ')')}
        {field('crop', t('farm.cropName'))}
      </div>

      <section className="card">
        <p className="lbl">{t('farm.cropStage')}</p>
        <div className="row wrap">
          {STAGES.map((s) => (
            <button key={s} className={'chip grow' + (farm.stage === s ? ' on' : '')}
              onClick={() => set('stage', s)}>{t('stages.' + s)}</button>
          ))}
        </div>
        {field('window', t('farm.weedWindow'))}
      </section>

      <section className="card">
        <p className="lbl">{t('farm.trend')}</p>
        <div className="row wrap">
          <button className="chip small" onClick={loadScans}>{t('farm.refresh')}</button>
          <button className="chip small" onClick={clearHistory} disabled={total === 0}>{t('farm.clearHistory')}</button>
        </div>
        <p className="lbl">{t('farm.totalScans', { n: total })}{last ? ' · ' + t('farm.lastScan', { when: new Date(last).toLocaleString() }) : ''}</p>
        {labels.length === 0 ? <p>{t('trend.empty')}</p> : (
          <Bar data={{
            labels: labels.map((l) => { const w = findWeed(l); return w ? weedText(w, i18n.language).name : l; }),
            datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: '#8B4720' }]
          }}
            options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
        )}
      </section>
    </>
  );
}
