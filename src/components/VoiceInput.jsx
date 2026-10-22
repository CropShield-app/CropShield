import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createModel } from 'vosk-browser';
import { voiceModels } from '../voiceModels.js';
import { langTag } from '../speech.js';

const loaded = {}; // offline Vosk models already loaded into memory, by language code
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Speak instead of typing.
//  - If a Vosk model is listed in voiceModels.js for this language: works OFFLINE.
//  - Otherwise, if the browser has speech recognition (Chrome, Edge, Safari): uses it. This
//    usually needs INTERNET, because the browser sends the audio to its maker to be turned into text.
// onText(text) is called while you speak. onDone(text) is called once when you stop.
export default function VoiceInput({ onText, onDone }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const file = voiceModels[lang];
  const [state, setState] = useState('idle'); // idle | loading | listening
  const [err, setErr] = useState('');
  const stopRef = useRef(null);
  const lastRef = useRef('');

  if (!file && !SR) return <p className="lbl">{t('voice.notAvailable')}</p>;

  const heard = (text) => { lastRef.current = text; if (onText) onText(text); };

  // Runs once when listening ends (second call finds no text and does nothing)
  function finish() {
    const text = lastRef.current;
    lastRef.current = '';
    stopRef.current = null;
    setState('idle');
    if (text && onDone) onDone(text);
  }

  function stop() {
    try { if (stopRef.current) stopRef.current(); } catch (e) {}
  }

  function startBrowser() {
    setErr('');
    const rec = new SR();
    rec.lang = langTag(lang);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      heard(text);
    };
    rec.onerror = (e) => setErr(t(e.error === 'not-allowed' ? 'voice.denied' : 'voice.failed'));
    rec.onend = finish;
    stopRef.current = () => rec.stop(); // the browser then calls onend -> finish
    setState('listening');
    rec.start();
  }

  async function startVosk() {
    setErr('');
    setState('loading');
    try {
      if (!loaded[lang]) loaded[lang] = await createModel(import.meta.env.BASE_URL + 'voice/' + file);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });
      const ctx = new AudioContext();
      const rec = new loaded[lang].KaldiRecognizer(ctx.sampleRate);
      rec.on('partialresult', (m) => m.result.partial && heard(m.result.partial));
      rec.on('result', (m) => m.result.text && heard(m.result.text));
      const node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (e) => rec.acceptWaveform(e.inputBuffer);
      const src = ctx.createMediaStreamSource(stream);
      src.connect(node);
      node.connect(ctx.destination);
      stopRef.current = () => {
        node.disconnect(); src.disconnect();
        stream.getTracks().forEach((tr) => tr.stop());
        ctx.close();
        try { rec.remove(); } catch (e) {}
        finish();
      };
      setState('listening');
    } catch (e) {
      setErr(t('voice.failed'));
      setState('idle');
    }
  }

  return (
    <div className="row wrap">
      <button className={'chip' + (state === 'listening' ? ' on' : '')} disabled={state === 'loading'}
        onClick={state === 'idle' ? (file ? startVosk : startBrowser) : stop}>
        {state === 'idle' ? t('voice.start') : state === 'loading' ? t('voice.loading') : t('voice.stop')}
      </button>
      <span className="lbl">{file ? t('voice.hint') : t('voice.hintOnline')}</span>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
