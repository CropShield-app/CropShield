import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classify } from '../classify.js';
import { db } from '../db.js';

const FRAMES = 8; // how many pictures we pull out of the video

// Jump the video to a time and wait until that picture is ready
function seek(video, time) {
  return new Promise((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = time;
  });
}

export default function VideoScan({ onResult }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState('');

  async function onFile(e) {
    const file = e.target.files[0];
    e.target.value = ''; // lets the farmer pick the same video again later
    if (!file) return;
    setBusy(true); setErr(''); setDone(0);
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;
      await new Promise((ok, no) => { video.onloadedmetadata = ok; video.onerror = () => no(new Error('video')); });
      if (!isFinite(video.duration) || video.duration <= 0) throw new Error('duration');

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = Math.round((video.videoHeight * 320) / video.videoWidth);
      const ctx = canvas.getContext('2d');

      const votes = {};
      for (let i = 0; i < FRAMES; i++) {
        await seek(video, ((i + 0.5) / FRAMES) * video.duration); // evenly spaced moments
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const r = await classify(canvas);
        if (r.demo) { onResult({ demo: true }); return; }
        const v = (votes[r.label] = votes[r.label] || { n: 0, sum: 0 });
        v.n += 1;
        v.sum += r.confidence;
        setDone(i + 1);
      }
      // The weed seen in the most frames wins (ties go to the higher total confidence)
      const label = Object.keys(votes).sort((a, b) => votes[b].n - votes[a].n || votes[b].sum - votes[a].sum)[0];
      const result = { label, confidence: votes[label].sum / votes[label].n, agree: votes[label].n, frames: FRAMES };
      db.scans.add({ label, confidence: result.confidence, time: Date.now(), source: 'video' });
      onResult(result);
    } catch (error) {
      setErr(t('video.failed'));
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  return (
    <>
      <label className="bigbtn">
        {busy ? t('video.working', { done, total: FRAMES }) : t('scan.uploadVideo')}
        <input type="file" accept="video/*" onChange={onFile} disabled={busy} hidden />
      </label>
      {err && <p className="err">{err}</p>}
    </>
  );
}
