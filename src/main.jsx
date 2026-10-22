import React from 'react';
import ReactDOM from 'react-dom/client';
import './setupI18n.js';
import App from './App.jsx';
import { loadSavedPacks } from './langs.js';

loadSavedPacks().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
});
