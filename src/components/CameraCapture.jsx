import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classify } from '../classify.js';
import { db } from '../db.js';

const FRAMES = 8; // pictures taken, one per second, during "Scan while moving"

// Opens the laptop webcam or phone camera right inside the page.
// Needs https or localhost (browsers block cameras on other plain-http links).
export default function CameraCapture({ onPhoto, onVideoResult }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setOpen(false);
  }

  // Switch the camera off if the page is closed
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
  }, []);

  // Once the <video> box is on screen, plug the camera into it
  useEffect(() => {
    if (open && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [open]);

  async function openCamera() {
    setErr('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErr(t('camera.insecure'));
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, // back camera on phones
        audio: false
      });
      setOpen(true);
    } catch (e) {
      setErr(t('camera.denied'));
    }
  }

  // Copy what the camera sees right now onto a canvas (a still picture)
  function grab() {
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c;
  }

  function takePhoto() {
    onPhoto(grab().toDataURL('image/jpeg', 0.9));
    stopCamera();
  }

  // "Video scan": take one picture a second while the farmer moves the camera over the weed
  async function sweep() {
    setBusy(true);
    setDone(0);
    try {
      const votes = {};
      for (let i = 0; i < FRAMES; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const r = await classify(grab());
        if (r.demo) { onVideoResult({ demo: true }); return; }
        const v = (votes[r.label] = votes[r.label] || { n: 0, sum: 0 });
        v.n += 1;
        v.sum += r.confidence;
        setDone(i + 1);
      }
      const label = Object.keys(votes).sort((a, b) => votes[b].n - votes[a].n || votes[b].sum - votes[a].sum)[0];
      const result = { label, confidence: votes[label].sum / votes[label].n, agree: votes[label].n, frames: FRAMES };
      db.scans.add({ label, confidence: result.confidence, time: Date.now(), source: 'camera' });
      onVideoResult(result);
    } finally {
      setBusy(false);
      stopCamera();
    }
  }

  if (!open) {
    return (
      <div>
        <button className="chip wide" onClick={openCamera}>{t('camera.open')}</button>
        {err && <p className="err">{err}</p>}
      </div>
    );
  }

  return (
    <section className="card">
      <video ref={videoRef} className="preview" playsInline muted />
      <div className="row wrap">
        <button className="chip primary" onClick={takePhoto} disabled={busy}>{t('camera.take')}</button>
        <button className="chip" onClick={sweep} disabled={busy}>
          {busy ? t('video.working', { done, total: FRAMES }) : t('camera.sweep')}
        </button>
        <button className="chip" onClick={stopCamera} disabled={busy}>{t('camera.close')}</button>
      </div>
      <p className="lbl">{t('camera.hint')}</p>
    </section>
  );
}
