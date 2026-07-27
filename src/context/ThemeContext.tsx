import React, { createContext, useContext, useEffect } from 'react';
import { VerticalId, VerticalTheme } from '../types';
import { useTenant } from './TenantContext';

const themes: Record<VerticalId, VerticalTheme> = {
  global: { id: 'global', name: 'Command Center', accentHex: '#D9A84E', glowRgba: 'rgba(217, 168, 78, 0.15)' },
  merchant: { id: 'merchant', name: 'Merchants Central', accentHex: '#DC2626', glowRgba: 'rgba(220, 38, 38, 0.15)' },
  autos: { id: 'autos', name: 'AutoHub Central', accentHex: '#22D3EE', glowRgba: 'rgba(34, 211, 238, 0.15)' },
  farmers: { id: 'farmers', name: 'Farmers Market Central', accentHex: '#BEF264', glowRgba: 'rgba(190, 242, 100, 0.15)' },
  estate: { id: 'estate', name: 'Estate Central', accentHex: '#10B981', glowRgba: 'rgba(16, 185, 129, 0.15)' },
  gold: { id: 'gold', name: 'Precious Metals Central', accentHex: '#FBBF24', glowRgba: 'rgba(251, 191, 36, 0.15)' },
  agents: { id: 'agents', name: 'Field Agents Central', accentHex: '#C084FC', glowRgba: 'rgba(192, 132, 252, 0.15)' },
  label: { id: 'label', name: 'BLKK Label Central', accentHex: '#FF5E9C', glowRgba: 'rgba(255, 94, 156, 0.15)' },
  appsWebsite: { id: 'appsWebsite', name: 'Websites & Apps Central', accentHex: '#3B82F6', glowRgba: 'rgba(59, 130, 246, 0.15)' },
  susu: { id: 'susu', name: 'Susu Rail & Payments Central', accentHex: '#14B8A6', glowRgba: 'rgba(20, 184, 166, 0.15)' },
  systemConfig: { id: 'systemConfig', name: 'System Config', accentHex: '#94A3B8', glowRgba: 'rgba(148, 163, 184, 0.15)' },
};

const ThemeContext = createContext<{ theme: VerticalTheme }>({ theme: themes.global });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentVertical } = useTenant();
  const theme = themes[currentVertical] || themes.global;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', theme.accentHex);
    root.style.setProperty('--theme-accent-glow', theme.glowRgba);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
