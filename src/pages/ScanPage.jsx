import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classify } from '../classify.js';
import { findWeed, weedText, weedLang } from '../weeds.js';
import { hasVoice, speak, stopSpeaking } from '../speech.js';
import { db } from '../db.js';
import AskBox from '../components/AskBox.jsx';
import VideoScan from '../components/VideoScan.jsx';
import CameraCapture from '../components/CameraCapture.jsx';

export default function ScanPage() {
  const { t, i18n } = useTranslation();
  const imgRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(localStorage.getItem('autoRead') !== '0'); // on unless turned off
  const [, refreshVoices] = useState(0);

  // Phones load their voices a moment late. Redraw when they arrive. Stop talking when leaving the page.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const again = () => refreshVoices((n) => n + 1);
    speechSynthesis.addEventListener('voiceschanged', again);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', again);
      stopSpeaking();
    };
  }, []);

  function onFile(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setRes(null);
    setSrc(URL.createObjectURL(f));
  }

  // Runs when the chosen photo has finished loading on screen
  async function scan() {
    setBusy(true);
    const r = await classify(imgRef.current);
    setRes(r);
    setBusy(false);
    if (!r.demo) db.scans.add({ label: r.label, confidence: r.confidence, time: Date.now(), source: 'photo' });
  }

  const weed = res && !res.demo ? findWeed(res.label) : null;
  const tx = weed ? weedText(weed, i18n.language) : null;
  const unsure = !!res && !res.demo && res.confidence < 0.6;
  const textLang = weed ? weedLang(weed, i18n.language) : i18n.language;

  // Read the name, advice, methods and caution aloud, in the language the text is written in
  function read() {
    if (unsure) {
      setSpeaking(true);
      speak(t('scan.notSure'), i18n.language, () => setSpeaking(false));
      return;
    }
    if (!tx) return;
    const text = [tx.name, tx.advice, tx.methods.join('. '), tx.caution].filter(Boolean).join('. ');
    setSpeaking(true);
    speak(text, textLang, () => setSpeaking(false));
  }
  function stop() {
    stopSpeaking();
    setSpeaking(false);
  }
  function toggleAuto(e) {
    setAutoRead(e.target.checked);
    localStorage.setItem('autoRead', e.target.checked ? '1' : '0');
  }

  // New result arrives: read it out loud by itself (if the switch is on)
  useEffect(() => {
    if (autoRead && res && !res.demo) read();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  return (
    <>
      <div className="row">
        <label className="bigbtn">
          {t('scan.uploadPhoto')}
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
        <VideoScan onResult={(r) => { setSrc(null); setRes(r); }} />
      </div>

      <CameraCapture
        onPhoto={(url) => { setRes(null); setSrc(url); }}
        onVideoResult={(r) => { setSrc(null); setRes(r); }}
      />

      <section className="card">
        <p className="lbl">{t('scan.result')}</p>
        {src && <img ref={imgRef} src={src} alt="" className="preview" onLoad={scan} />}
        {busy && <p>...</p>}
        {res?.demo && <p className="note">{t('scan.demo')}</p>}
        {res?.demo && res.error && <p className="lbl">{res.error}</p>}
        {unsure && <p className="note">{t('scan.notSure')}</p>}
        {res && !res.demo && (
          <h2>{tx ? tx.name : res.label} <small>{Math.round(res.confidence * 100)}%</small></h2>
        )}
        {res && !res.demo && !weed && <p className="note">{t('scan.noEntry', { label: res.label })}</p>}
        {res?.top && res.top.length > 1 && (
          <p className="lbl">{t('scan.top')}: {res.top.slice(1).map((x) => {
            const w = findWeed(x.label);
            return (w ? weedText(w, i18n.language).name : x.label) + ' ' + Math.round(x.confidence * 100) + '%';
          }).join(' · ')}</p>
        )}
        {res?.frames && <p className="lbl">{t('scan.frames', { n: res.agree, total: res.frames })}</p>}
        {tx && !unsure && (
          <>
            <p>{tx.advice}</p>
            {tx.methods.length > 0 && <ul>{tx.methods.map((m) => <li key={m}>{m}</li>)}</ul>}
            {tx.caution && <p className="note">{tx.caution}</p>}
          </>
        )}
        {res && !res.demo && (tx || unsure) && (
          <>
            <button className="chip primary" onClick={speaking ? stop : read}>
              {speaking ? t('scan.stop') : t('scan.listen')}
            </button>
            {!hasVoice(textLang) && <p className="lbl">{t('scan.noVoice')}</p>}
          </>
        )}
        <label className="row">
          <input className="check" type="checkbox" checked={autoRead} onChange={toggleAuto} />
          <span className="lbl">{t('scan.autoRead')}</span>
        </label>
      </section>

      <AskBox />
    </>
  );
}
