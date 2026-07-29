import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-adinkra-black text-white">
      <a href="#main-content" className="sr-only z-50 rounded bg-white px-3 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle background glow based on current theme */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-[0.15] transition-colors duration-1000 z-0"
          style={{ background: 'var(--theme-accent)' }}
        />
        
        <Topbar />
        <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8 relative z-10 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
