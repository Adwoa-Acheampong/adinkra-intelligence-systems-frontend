import React, { createContext, useContext, useState } from 'react';
import { TenantContextType, VerticalId, Tenant } from '../types';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVertical, setCurrentVertical] = useState<VerticalId>('global');
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  return (
    <TenantContext.Provider value={{ currentVertical, setCurrentVertical, currentTenant, setCurrentTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
