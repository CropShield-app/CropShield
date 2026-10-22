import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Every file in src/i18n/ (except languages.json) is a language pack. Add a file, get a language.
const packs = import.meta.glob('./i18n/*.json', { eager: true });
const resources = {};
for (const [path, mod] of Object.entries(packs)) {
  const code = path.split('/').pop().replace('.json', '');
  if (code === 'languages') continue;
  resources[code] = { translation: mod.default };
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
