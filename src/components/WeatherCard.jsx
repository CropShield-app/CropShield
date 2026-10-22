import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db.js';
import { getFix } from '../geo.js';

// Needs internet only to UPDATE. The last forecast is saved on the phone and shown offline.
// Data: Open-Meteo (free, no key). Your coordinates are sent to open-meteo.com when you update.
export default function WeatherCard() {
  const { t } = useTranslation();
  const [w, setW] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { db.weather.get(1).then((x) => x && setW(x)); }, []);

  async function update() {
    setBusy(true); setMsg('');
    try {
      const loc = w ? { lat: w.lat, lng: w.lng } : await getFix();
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat.toFixed(3) +
        '&longitude=' + loc.lng.toFixed(3) +
        '&current=temperature_2m,relative_humidity_2m' +
        '&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto';
      const r = await fetch(url);
      if (!r.ok) throw new Error('http');
      const d = await r.json();
      const rec = {
        id: 1, lat: loc.lat, lng: loc.lng, fetchedAt: Date.now(),
        temp: d.current.temperature_2m, humidity: d.current.relative_humidity_2m,
        days: d.daily.time.map((day, i) => ({
          day, rain: d.daily.precipitation_sum[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i]
        }))
      };
      await db.weather.put(rec);
      setW(rec);
    } catch (e) {
      setMsg(t('weather.failed'));
    }
    setBusy(false);
  }

  const rainSoon = w && w.days.some((d) => d.rain > 0);

  return (
    <section className="card">
      <p className="lbl">{t('weather.title')}</p>
      {!w && <p>{t('weather.none')}</p>}
      {w && (
        <>
          <h3>{w.temp}°C · {w.humidity}%</h3>
          <ul className="plain">
            {w.days.map((d) => (
              <li key={d.day}>{d.day}: {d.min}–{d.max}°C, {t('weather.rain')} {d.rain} mm</li>
            ))}
          </ul>
          {rainSoon && <p className="note">{t('weather.rainCaution')}</p>}
          <p className="lbl">{t('weather.updated', { when: new Date(w.fetchedAt).toLocaleString() })}</p>
        </>
      )}
      <button className="chip" onClick={update} disabled={busy}>{busy ? '...' : t('weather.update')}</button>
      {msg && <p className="err">{msg}</p>}
    </section>
  );
}
