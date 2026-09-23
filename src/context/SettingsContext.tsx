import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '../types/recipe';
import { getSettingsFromDB, saveSettingsToDB } from '../services/storage';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  repoOwner: 'carljmosca',
  repoName: 'recipes',
  branch: 'main',
  subdirectory: '',
  autoSyncOnLaunch: true,
  theme: 'system',
  keepAwakeInCookingMode: true,
  speechVoiceRate: 1.0
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettingsFromDB().then((loaded) => {
      setSettings(loaded);
      applyTheme(loaded.theme);
    });
  }, []);

  const applyTheme = (theme: AppSettings['theme']) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
    await saveSettingsToDB(merged);
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    await saveSettingsToDB(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

