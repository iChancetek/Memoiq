
'use client';

import * as React from 'react';
import { useAuth } from './auth-context';
import en from '@/lib/locales/en.json';
import es from '@/lib/locales/es.json';

type Locale = 'en' | 'es';

const translations = { en, es };

interface LanguageContextType {
  t: (key: keyof typeof en) => string;
  language: Locale;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // @ts-ignore
  const userLanguage = user?.settings?.uiLanguage || 'en';
  const [language, setLanguage] = React.useState<Locale>(userLanguage);

  React.useEffect(() => {
      // @ts-ignore
    setLanguage(user?.settings?.uiLanguage || 'en');
  }, [user]);

  const t = (key: keyof typeof en) => {
    return translations[language][key] || translations.en[key];
  };

  const value = { t, language };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
