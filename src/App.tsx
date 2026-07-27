import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { VerticalDashboard } from './pages/VerticalDashboard';
import { TenantERPShell } from './components/tenant/TenantERPShell';

const MainLayout = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<CommandCenter />} />
      <Route path="/merchant" element={<VerticalDashboard verticalId="merchant" />} />
      <Route path="/autos" element={<VerticalDashboard verticalId="autos" />} />
      <Route path="/farmers" element={<VerticalDashboard verticalId="farmers" />} />
      <Route path="/estate" element={<VerticalDashboard verticalId="estate" />} />
      <Route path="/label" element={<VerticalDashboard verticalId="label" />} />
      <Route path="/gold" element={<VerticalDashboard verticalId="gold" />} />
      <Route path="/agents" element={<VerticalDashboard verticalId="agents" />} />
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

