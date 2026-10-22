import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { db } from '../db.js';
import { encodeJob, decodeJob, smsLink, phoneOk } from '../jobCode.js';
import VoiceInput from '../components/VoiceInput.jsx';

const BLANK = { crop: '', date: '', wage: '', note: '', phone: '' };
const FILTERS = ['all', 'open', 'mine', 'received', 'done'];

// Read a QR code out of a photo the farmer took of another phone's screen
function readQr(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const q = jsQR(d.data, d.width, d.height);
      URL.revokeObjectURL(img.src);
      q ? resolve(q.data) : reject(new Error('no-qr'));
    };
    img.onerror = () => reject(new Error('img'));
    img.src = URL.createObjectURL(file);
  });
}

export default function LaborPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [qr, setQr] = useState(null);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const load = () => db.jobs.orderBy('date').toArray().then(setJobs);
  useEffect(() => { load(); }, []);

  const input = (k, label, props = {}) => (
    <label>
      <span className="lbl">{label}</span>
      <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...props} />
    </label>
  );

  async function add() {
    if (!form.crop.trim()) return;
    await db.jobs.add({ ...form, mine: 1, done: 0 });
    setForm(BLANK);
    setFilter('open');
    load();
  }
  async function importCode(text) {
    try {
      await db.jobs.add({ ...decodeJob(text), mine: 0, done: 0 });
      setPaste('');
      setMsg(t('labor.imported'));
      load();
    } catch (e) {
      setMsg(t('labor.bad'));
    }
  }
  async function onQrPhoto(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { importCode(await readQr(f)); } catch (err) { setMsg(t('labor.noQr')); }
  }
  async function showQr(job) {
    setQr(await QRCode.toDataURL(encodeJob(job), { width: 280, margin: 1, errorCorrectionLevel: 'L' }));
  }
  const remove = async (id) => { await db.jobs.delete(id); load(); };
  const toggleDone = async (j) => { await db.jobs.update(j.id, { done: j.done ? 0 : 1 }); load(); };

  // The job board: filter by tab, then by what was typed or spoken, open jobs first, soonest date first
  const words = search.trim().toLowerCase();
  const shown = jobs
    .filter((j) => {
      if (filter === 'open' && j.done) return false;
      if (filter === 'done' && !j.done) return false;
      if (filter === 'mine' && !j.mine) return false;
      if (filter === 'received' && j.mine) return false;
      return [j.crop, j.date, j.wage, j.note].join(' ').toLowerCase().includes(words);
    })
    .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.date || '9999').localeCompare(b.date || '9999'));

  const openCount = jobs.filter((j) => !j.done).length;

  return (
    <>
      <section className="card">
        <p className="lbl">{t('labor.board')}</p>
        <h2>{t('labor.openCount', { n: openCount })}</h2>
        <p className="lbl">{t('labor.boardNote')}</p>
        <input value={search} placeholder={t('labor.search')} onChange={(e) => setSearch(e.target.value)} />
        <VoiceInput onText={setSearch} />
        <div className="row wrap">
          {FILTERS.map((f) => (
            <button key={f} className={'chip small' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
              {t('labor.filter_' + f)}
            </button>
          ))}
        </div>
        <p className="lbl">{t('labor.showing', { n: shown.length, total: jobs.length })}</p>
      </section>

      {shown.map((j) => (
        <section className="card" key={j.id}>
          <div className="row">
            <span className={'badge' + (j.done ? ' off' : '')}>{j.done ? t('labor.statusDone') : t('labor.statusOpen')}</span>
            <span className="lbl">{j.mine ? t('labor.mine') : t('labor.received')}</span>
          </div>
          <h3>{j.crop}</h3>
          <p>{[j.date, j.wage].filter(Boolean).join(' · ')}</p>
          {j.note && <p>{j.note}</p>}
          {phoneOk(j.phone) && <a href={'tel:' + j.phone}>{j.phone}</a>}
          <div className="row wrap">
            <button className="chip" onClick={() => toggleDone(j)}>{j.done ? t('labor.reopen') : t('labor.markDone')}</button>
            <a className="chip" href={smsLink(j)}>{t('labor.sms')}</a>
            <button className="chip" onClick={() => showQr(j)}>{t('labor.qr')}</button>
            <button className="chip" onClick={() => remove(j.id)}>{t('labor.delete')}</button>
          </div>
        </section>
      ))}
      {shown.length === 0 && <p>{t('labor.empty')}</p>}

      <section className="card">
        <p className="lbl">{t('labor.title')}</p>
        {input('crop', t('labor.crop'))}
        {input('date', t('labor.date'), { type: 'date' })}
        {input('wage', t('labor.wage'))}
        {input('note', t('labor.note'))}
        {input('phone', t('labor.phone'), { inputMode: 'tel' })}
        <button className="chip primary" onClick={add}>{t('labor.add')}</button>
      </section>

      <section className="card">
        <p className="lbl">{t('labor.importTitle')}</p>
        <textarea rows="3" value={paste} placeholder={t('labor.paste')} onChange={(e) => setPaste(e.target.value)} />
        <div className="row wrap">
          <button className="chip primary" onClick={() => importCode(paste)}>{t('labor.import')}</button>
          <label className="chip filebtn">
            {t('labor.scanQr')}
            <input type="file" accept="image/*" capture="environment" onChange={onQrPhoto} hidden />
          </label>
        </div>
        {msg && <p className="note">{msg}</p>}
      </section>

      {qr && (
        <div className="overlay" onClick={() => setQr(null)}>
          <div className="sheet"><img className="qr" src={qr} alt="QR code" /><p className="lbl">{t('labor.qrHint')}</p></div>
        </div>
      )}
    </>
  );
}
