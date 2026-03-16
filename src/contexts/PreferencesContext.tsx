import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PreferencesContextType {
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  setDateFormat: (format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [dateFormat, setDateFormat] = useState<'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'>(() => {
    return (localStorage.getItem('dateFormat') as any) || 'MM/DD/YYYY';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <PreferencesContext.Provider value={{ dateFormat, setDateFormat, darkMode, setDarkMode }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
