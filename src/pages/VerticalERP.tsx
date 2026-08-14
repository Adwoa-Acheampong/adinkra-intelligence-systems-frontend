import React from 'react';
import { Route, Routes } from 'react-router-dom';
import type { VerticalId } from '../types';
import { VerticalDashboard } from './VerticalDashboard';
import { ERPModulePage } from './ERPModulePage';

export const VerticalERP: React.FC<{ verticalId: VerticalId }> = ({ verticalId }) => (
  <Routes>
    <Route index element={<VerticalDashboard verticalId={verticalId} />} />
    <Route path=":moduleId" element={<ERPModulePage />} />
  </Routes>
);
