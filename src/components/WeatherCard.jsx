import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db.js';
import { getFix } from '../geo.js';

// A fresh forecast needs internet. The last forecast is saved on the phone, so it is shown offline,
// with its age. When the internet comes back, an old forecast is refreshed by itself.
// Data: Open-Meteo (free, no key). Your coordinates are sent to open-meteo.com when you update.
const OLD_AFTER_HOURS = 6;      // warn when the saved forecast is older than this
const AUTO_REFRESH_HOURS = 3;   // refresh by itself, when online, if older than this

async function fetchForecast(loc) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat.toFixed(3) +
    '&longitude=' + loc.lng.toFixed(3) +
    '&current=temperature_2m,relative_humidity_2m' +
    '&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto';
  const r = await fetch(url);
  if (!r.ok) throw new Error('http');
  const d = await r.json();
  return {
    id: 1, lat: loc.lat, lng: loc.lng, fetchedAt: Date.now(),
    temp: d.current.temperature_2m, humidity: d.current.relative_humidity_2m,
    days: d.daily.time.map((day, i) => ({
      day, rain: d.daily.precipitation_sum[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i]
    }))
  };
}

export default function WeatherCard() {
  const { t } = useTranslation();
  const [w, setW] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  async function refresh(saved) {
    setBusy(true); setMsg('');
    try {
      const loc = saved ? { lat: saved.lat, lng: saved.lng } : await getFix();
      const rec = await fetchForecast(loc);
      await db.weather.put(rec);
      setW(rec);
    } catch (e) {
      setMsg(t('weather.failed'));
    }
    setBusy(false);
  }

  useEffect(() => {
    const stale = (s) => !s || Date.now() - s.fetchedAt > AUTO_REFRESH_HOURS * 3600 * 1000;
    // show what is saved, and refresh quietly if we are online and it is old (only when a location is already saved)
    db.weather.get(1).then((saved) => {
      if (saved) setW(saved);
      if (saved && navigator.onLine && stale(saved)) refresh(saved);
    });
    const goOnline = async () => {
      setOnline(true);
      const saved = await db.weather.get(1);
      if (saved && stale(saved)) refresh(saved);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ageHours = w ? Math.floor((Date.now() - w.fetchedAt) / 3600000) : 0;
  const rainSoon = w && w.days.some((d) => d.rain > 0);

  return (
    <section className="card">
      <p className="lbl">{t('weather.title')}</p>
      {!online && <p className="note">{t('weather.offline')}</p>}
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
          {ageHours >= OLD_AFTER_HOURS && <p className="note">{t('weather.old', { h: ageHours })}</p>}
          <p className="lbl">{t('weather.updated', { when: new Date(w.fetchedAt).toLocaleString() })}</p>
        </>
      )}
      <button className="chip" onClick={() => refresh(w)} disabled={busy || !online}>{busy ? '...' : t('weather.update')}</button>
      {msg && <p className="err">{msg}</p>}
    </section>
  );
}
