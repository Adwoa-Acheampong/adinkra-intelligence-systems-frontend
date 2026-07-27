import React, { createContext, useContext, useEffect } from 'react';
import { VerticalId, VerticalTheme } from '../types';
import { useTenant } from './TenantContext';

const themes: Record<VerticalId, VerticalTheme> = {
  global: { id: 'global', name: 'Command Center', accentHex: '#D9A84E', glowRgba: 'rgba(217, 168, 78, 0.15)' }, // Gold
  merchant: { id: 'merchant', name: 'Merchant Marketplace', accentHex: '#DC2626', glowRgba: 'rgba(220, 38, 38, 0.15)' }, // Red
  autos: { id: 'autos', name: 'AutoHub', accentHex: '#22D3EE', glowRgba: 'rgba(34, 211, 238, 0.15)' }, // Cyan
  farmers: { id: 'farmers', name: 'Farmers Market', accentHex: '#BEF264', glowRgba: 'rgba(190, 242, 100, 0.15)' }, // Lemon/Lime
  estate: { id: 'estate', name: 'Estate', accentHex: '#10B981', glowRgba: 'rgba(16, 185, 129, 0.15)' }, // Emerald
  gold: { id: 'gold', name: 'Precious Metals', accentHex: '#FBBF24', glowRgba: 'rgba(251, 191, 36, 0.15)' }, // Amber
  agents: { id: 'agents', name: 'Agents', accentHex: '#C084FC', glowRgba: 'rgba(192, 132, 252, 0.15)' }, // Purple
  label: { id: 'label', name: 'Blkk Label', accentHex: '#FF5E9C', glowRgba: 'rgba(255, 94, 156, 0.15)' }, // Pink
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
