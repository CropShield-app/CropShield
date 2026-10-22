import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { allLanguages, importPack, setLanguage } from '../langs.js';

export default function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [langs, setLangs] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const refresh = () => allLanguages().then(setLangs);
  useEffect(() => { refresh(); }, []);

  const current = langs.find((l) => l.code === i18n.language);
  const shown = langs.filter((l) =>
    (l.name + ' ' + l.native + ' ' + l.code).toLowerCase().includes(query.toLowerCase())
  );

  async function onImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importPack(file);
      setError('');
      refresh();
    } catch (err) {
      setError('Not a valid language pack file.');
    }
  }

  return (
    <>
      <div className="row">
        <button className="chip on grow" onClick={() => setOpen(true)}>
          {current ? current.native + ' · ' + current.name : i18n.language}
        </button>
        <button className="chip grow" onClick={() => setOpen(true)}>{t('lang.all')}</button>
      </div>

      {open && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="sheet">
            <div className="row">
              <input className="grow" autoFocus placeholder={t('lang.search')} value={query}
                onChange={(e) => setQuery(e.target.value)} />
              <button className="chip" onClick={() => setOpen(false)}>X</button>
            </div>
            <ul className="langlist">
              {shown.map((l) => (
                <li key={l.code}>
                  <button className={'chip wide' + (l.code === i18n.language ? ' on' : '')}
                    onClick={() => { setLanguage(l.code); setOpen(false); }}>
                    {l.native} · {l.name}{l.reviewed ? '' : ' (draft)'}
                  </button>
                </li>
              ))}
            </ul>
            <label className="chip wide filebtn">
              {t('lang.import')}
              <input type="file" accept="application/json,.json" onChange={onImport} hidden />
            </label>
            {error && <p className="err">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
