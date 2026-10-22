import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScanPage from './pages/ScanPage.jsx';
import FarmPage from './pages/FarmPage.jsx';
import LaborPage from './pages/LaborPage.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import './styles.css';
import './addons.css';

export default function App() {
  const { t } = useTranslation();
  const [big, setBig] = useState(localStorage.getItem('big') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('big', big);
    localStorage.setItem('big', big ? '1' : '0');
  }, [big]);

  return (
    <HashRouter>
      <div className="app">
        <header className="top">
          <h1>{t('app.name')}</h1>
          <span className="pill">{t('app.offline')}</span>
          <button className="chip" onClick={() => setBig(!big)} aria-label="Bigger text">A+</button>
        </header>
        <LanguagePicker />
        <main>
          <Routes>
            <Route path="/" element={<ScanPage />} />
            <Route path="/farm" element={<FarmPage />} />
            <Route path="/jobs" element={<LaborPage />} />
          </Routes>
        </main>
        <nav className="tabs">
          <NavLink to="/" end className="tab">{t('nav.scanAsk')}</NavLink>
          <NavLink to="/farm" className="tab">{t('nav.myFarm')}</NavLink>
          <NavLink to="/jobs" className="tab">{t('nav.jobs')}</NavLink>
        </nav>
      </div>
    </HashRouter>
  );
}
