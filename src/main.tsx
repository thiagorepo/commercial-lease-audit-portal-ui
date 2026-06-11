import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <App />
        <Toaster />
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>
);
