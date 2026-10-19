'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ColorScheme = 'default' | 'blue-orange' | 'purple-yellow' | 'monochrome' | 'custom';

interface ConfigContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  customWinColor: string;
  setCustomWinColor: (color: string) => void;
  customLossColor: string;
  setCustomLossColor: (color: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customWinColor, setCustomWinColor] = useState<string>('#10b981');
  const [customLossColor, setCustomLossColor] = useState<string>('#f43f5e');

  useEffect(() => {
    const savedScheme = localStorage.getItem('journal-color-scheme') as ColorScheme;
    if (savedScheme) setColorScheme(savedScheme);
    
    const savedWin = localStorage.getItem('journal-win-color');
    if (savedWin) setCustomWinColor(savedWin);
    
    const savedLoss = localStorage.getItem('journal-loss-color');
    if (savedLoss) setCustomLossColor(savedLoss);
  }, []);

  useEffect(() => {
    localStorage.setItem('journal-color-scheme', colorScheme);
    const root = document.documentElement;
    
    // Reset to defaults first
    root.style.removeProperty('--win-50');
    root.style.removeProperty('--win-100');
    root.style.removeProperty('--win-400');
    root.style.removeProperty('--win-500');
    root.style.removeProperty('--win-600');
    root.style.removeProperty('--win-700');
    
    root.style.removeProperty('--loss-50');
    root.style.removeProperty('--loss-100');
    root.style.removeProperty('--loss-400');
    root.style.removeProperty('--loss-500');
    root.style.removeProperty('--loss-600');
    root.style.removeProperty('--loss-700');

    if (colorScheme === 'blue-orange') {
      // Blue for WIN (using blue tailwind scale)
      root.style.setProperty('--win-50', '#eff6ff');
      root.style.setProperty('--win-100', '#dbeafe');
      root.style.setProperty('--win-400', '#60a5fa');
      root.style.setProperty('--win-500', '#3b82f6');
      root.style.setProperty('--win-600', '#2563eb');
      root.style.setProperty('--win-700', '#1d4ed8');
      
      // Orange for LOSS (using orange tailwind scale)
      root.style.setProperty('--loss-50', '#fff7ed');
      root.style.setProperty('--loss-100', '#ffedd5');
      root.style.setProperty('--loss-400', '#fb923c');
      root.style.setProperty('--loss-500', '#f97316');
      root.style.setProperty('--loss-600', '#ea580c');
      root.style.setProperty('--loss-700', '#c2410c');
    } else if (colorScheme === 'purple-yellow') {
      // Purple for WIN
      root.style.setProperty('--win-50', '#faf5ff');
      root.style.setProperty('--win-100', '#f3e8ff');
      root.style.setProperty('--win-400', '#c084fc');
      root.style.setProperty('--win-500', '#a855f7');
      root.style.setProperty('--win-600', '#9333ea');
      root.style.setProperty('--win-700', '#7e22ce');
      
      // Yellow for LOSS
      root.style.setProperty('--loss-50', '#fefce8');
      root.style.setProperty('--loss-100', '#fef08a');
      root.style.setProperty('--loss-400', '#facc15');
      root.style.setProperty('--loss-500', '#eab308');
      root.style.setProperty('--loss-600', '#ca8a04');
      root.style.setProperty('--loss-700', '#a16207');
    } else if (colorScheme === 'custom') {
      root.style.setProperty('--win-50', customWinColor + '22');
      root.style.setProperty('--win-100', customWinColor + '33');
      root.style.setProperty('--win-400', customWinColor);
      root.style.setProperty('--win-500', customWinColor);
      root.style.setProperty('--win-600', customWinColor);
      root.style.setProperty('--win-700', customWinColor);
      
      root.style.setProperty('--loss-50', customLossColor + '22');
      root.style.setProperty('--loss-100', customLossColor + '33');
      root.style.setProperty('--loss-400', customLossColor);
      root.style.setProperty('--loss-500', customLossColor);
      root.style.setProperty('--loss-600', customLossColor);
      root.style.setProperty('--loss-700', customLossColor);
    }
  }, [colorScheme, customWinColor, customLossColor]);

  useEffect(() => {
    localStorage.setItem('journal-win-color', customWinColor);
  }, [customWinColor]);

  useEffect(() => {
    localStorage.setItem('journal-loss-color', customLossColor);
  }, [customLossColor]);

  return (
    <ConfigContext.Provider value={{ 
      colorScheme, setColorScheme,
      customWinColor, setCustomWinColor,
      customLossColor, setCustomLossColor
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
