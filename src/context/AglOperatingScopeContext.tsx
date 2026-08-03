import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_AGL_OPERATING_SCOPE,
  readAglOperatingScope,
  saveAglOperatingScope,
  type AglOperatingScope,
} from '../erp/agl/operatingScope';

interface AglOperatingScopeContextValue {
  scope: AglOperatingScope;
  setScope: (scope: AglOperatingScope) => void;
  patchScope: (patch: Partial<AglOperatingScope>) => void;
  resetScope: () => void;
}

const AglOperatingScopeContext = createContext<AglOperatingScopeContextValue | undefined>(undefined);

export const AglOperatingScopeProvider = ({ children }: { children: ReactNode }) => {
  const [scope, setScopeState] = useState(readAglOperatingScope);

  const commit = (next: AglOperatingScope) => {
    setScopeState(next);
    saveAglOperatingScope(next);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agl-erp-change', { detail: { reason: 'operating-scope' } }));
  }, [scope]);

  const value = useMemo<AglOperatingScopeContextValue>(() => ({
    scope,
    setScope: commit,
    patchScope: (patch) => commit({ ...scope, ...patch }),
    resetScope: () => commit(DEFAULT_AGL_OPERATING_SCOPE),
  }), [scope]);

  return (
    <AglOperatingScopeContext.Provider value={value}>
      {children}
    </AglOperatingScopeContext.Provider>
  );
};

export const useAglOperatingScope = () => {
  const context = useContext(AglOperatingScopeContext);
  if (!context) throw new Error('useAglOperatingScope must be used within AglOperatingScopeProvider.');
  return context;
};
