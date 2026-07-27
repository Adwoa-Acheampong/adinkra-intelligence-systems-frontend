import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { VerticalDashboard } from './pages/VerticalDashboard';
import { TenantERPShell } from './components/tenant/TenantERPShell';
import { SystemConfig } from './pages/SystemConfig';
import { WebsitesApps } from './pages/WebsitesApps';

const MainLayout = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<CommandCenter />} />
      <Route path="/merchant" element={<VerticalDashboard verticalId="merchant" />} />
      <Route path="/autos" element={<VerticalDashboard verticalId="autos" />} />
      <Route path="/farmers" element={<VerticalDashboard verticalId="farmers" />} />
      <Route path="/estate" element={<VerticalDashboard verticalId="estate" />} />
      <Route path="/label" element={<VerticalDashboard verticalId="label" />} />
      
      {/* New Top Level Routes - currently using VerticalDashboard placeholders or new components soon */}
      <Route path="/apps-website" element={<WebsitesApps />} />
      <Route path="/susu" element={<VerticalDashboard verticalId="susu" />} />
      <Route path="/gold" element={<VerticalDashboard verticalId="gold" />} />
      <Route path="/agents" element={<VerticalDashboard verticalId="agents" />} />
      <Route path="/system-config" element={<SystemConfig />} />
      
      {/* Catch-all redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AppShell>
);

const App = () => {
  return (
    <BrowserRouter>
      <TenantProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/:verticalId/tenant/:tenantId/*" element={<TenantERPShell />} />
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </ThemeProvider>
      </TenantProvider>
    </BrowserRouter>
  );
};

export default App;

