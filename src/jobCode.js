// A labor job is turned into one line of text (the "job code").
// The same code goes inside an SMS, a QR code, or can be pasted by hand. No server needed.
const PREFIX = 'CROPSHIELD1:';

export function encodeJob(job) {
  const small = { c: job.crop, d: job.date, w: job.wage, n: job.note, p: job.phone };
  return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(small)))); // unescape/encodeURIComponent keeps Telugu etc. safe
}

// Received text is untrusted: keep only known fields and cut them to a safe length.
export function decodeJob(text) {
  const i = text.indexOf(PREFIX);
  if (i < 0) throw new Error('not-a-job');
  const code = text.slice(i + PREFIX.length).split(/\s/)[0];
  const s = JSON.parse(decodeURIComponent(escape(atob(code))));
  const clip = (v, n) => String(v || '').slice(0, n);
  return { crop: clip(s.c, 60), date: clip(s.d, 20), wage: clip(s.w, 20), note: clip(s.n, 200), phone: clip(s.p, 20) };
}

export function smsLink(job) {
  const readable = [job.crop, job.date, job.wage, job.note].filter(Boolean).join(' | ');
  return 'sms:?&body=' + encodeURIComponent(readable + '\n' + encodeJob(job));
}

export const phoneOk = (p) => /^\+?\d{6,15}$/.test(p || '');
