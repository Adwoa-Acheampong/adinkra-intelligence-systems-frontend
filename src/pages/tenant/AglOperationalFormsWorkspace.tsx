import type { Tenant } from '../../types';
import { AglReportingWorkspace } from './AglReportingWorkspace';

export const AglOperationalFormsWorkspace = ({ tenant }: { tenant: Tenant }) => (
  <AglReportingWorkspace tenant={tenant} moduleId="forms" />
);
