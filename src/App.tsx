import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { TenantERPShell } from './components/tenant/TenantERPShell';
import { SystemConfig } from './pages/SystemConfig';
import { WebsitesApps } from './pages/WebsitesApps';
import { VerticalERP } from './pages/VerticalERP';
import { ERPModulePage } from './pages/ERPModulePage';
import { IntelligenceExplorer } from './pages/IntelligenceExplorer';

const MainLayout = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<CommandCenter />} />
      <Route path="/intelligence" element={<IntelligenceExplorer />} />
      <Route path="/ontology" element={<Navigate to="/intelligence?view=ontology" replace />} />
      <Route path="/merchant/*" element={<VerticalERP verticalId="merchant" />} />
      <Route path="/autos/*" element={<VerticalERP verticalId="autos" />} />
      <Route path="/farmers/*" element={<VerticalERP verticalId="farmers" />} />
      <Route path="/estate/*" element={<VerticalERP verticalId="estate" />} />
      <Route path="/label/*" element={<VerticalERP verticalId="label" />} />
      
      {/* New Top Level Routes - currently using VerticalDashboard placeholders or new components soon */}
      <Route path="/apps-website/*" element={<WebsitesApps />} />
      <Route path="/susu/*" element={<VerticalERP verticalId="susu" />} />
      <Route path="/gold/*" element={<VerticalERP verticalId="gold" />} />
      <Route path="/agents/*" element={<VerticalERP verticalId="agents" />} />
      <Route path="/system-config" element={<SystemConfig />} />
      <Route path="/:moduleId" element={<ERPModulePage />} />
      
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

