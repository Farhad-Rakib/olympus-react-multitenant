import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Registers i18next before the first render; the tenant locale is applied once settings load.
import { loadLanguage } from './core/i18n';
import { resolveLanguage } from './core/stores/language.store';

// Apply the viewer's saved language before the first paint of the login page; the tenant's
// locale (if it differs) is applied once site settings arrive after sign-in.
void loadLanguage(resolveLanguage(null));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
