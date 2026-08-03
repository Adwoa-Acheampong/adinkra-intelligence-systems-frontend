import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  KeyRound,
  MapPin,
  Plus,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { AGL_PERMISSION_KEYS, aglAdministrationWorkflow, type PermissionKey } from '../../erp/agl/administrationWorkflow';

type ModuleId = 'roles' | 'users' | 'locations' | 'integrations' | 'settings';
const actor = { name: 'AGL Admin', role: 'Administrator' };

export const AglAdministrationWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: ModuleId }) => {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const run = (work: () => unknown, message: string | ((value: unknown) => string)) => {
    try {
      const value = work();
      setFeedback(typeof message === 'function' ? message(value) : message);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The administration action failed.');
    }
  };
  return <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
    <header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / GOVERNANCE & ADMINISTRATION</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{titles[moduleId]}</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{descriptions[moduleId]}</p></header>
    {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')}><X size={13} /></button></div>}
    {moduleId === 'roles' && <Roles version={version} run={run} />}
    {moduleId === 'users' && <UsersWorkspace version={version} run={run} />}
    {moduleId === 'locations' && <Locations version={version} run={run} />}
    {moduleId === 'integrations' && <Integrations version={version} run={run} />}
    {moduleId === 'settings' && <SettingsWorkspace version={version} run={run} />}
  </div>;
};

interface Props { version: number; run: (work: () => unknown, message: string | ((value: unknown) => string)) => void }

const Roles = ({ version, run }: Props) => {
  const roles = useMemo(() => aglErpRepository.list('roles'), [version]);
  const [values, setValues] = useState({ name: '', scope: 'Workshop', permissions: ['view'] as PermissionKey[], owner: 'AGL Admin', notes: '' });
  const toggle = (permission: PermissionKey) => setValues((current) => ({ ...current, permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission] }));
  return <>
    <section className="grid gap-3 sm:grid-cols-3"><SemanticMetric icon={<Shield size={15} />} label="Roles defined" value={roles.length} detail="Named operating access profiles" /><SemanticMetric icon={<ShieldCheck size={15} />} label="Privileged roles" value={roles.filter((item) => String(item.permissions).includes('administer')).length} detail="Requires quarterly access review" /><SemanticMetric icon={<UserCog size={15} />} label="Scopes covered" value={new Set(roles.map((item) => String(item.scope))).size} detail="ERP and department boundaries" /></section>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.createRole(actor, values), 'Role created without any finance semantics.'); }} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Role name"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field><Field label="Operating scope"><select value={values.scope} onChange={(e) => setValues({ ...values, scope: e.target.value })}>{['All ERP', 'Workshop', 'Inventory', 'Sales', 'Finance', 'People', 'Management', 'Administration'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Access owner"><input value={values.owner} onChange={(e) => setValues({ ...values, owner: e.target.value })} /></Field></div>
      <fieldset className="mt-4"><legend className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Permission set</legend><div className="mt-2 flex flex-wrap gap-2">{AGL_PERMISSION_KEYS.map((permission) => <button type="button" key={permission} onClick={() => toggle(permission)} className={`rounded-lg border px-3 py-2 text-[9px] capitalize ${values.permissions.includes(permission) ? 'border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-200' : 'border-white/[0.08] text-gray-600'}`}>{permission}</button>)}</div></fieldset>
      <button className="mt-4 flex min-h-10 items-center gap-2 rounded-lg bg-cyan-300 px-4 text-[10px] font-semibold text-black"><Plus size={13} /> Add controlled role</button>
    </form>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{roles.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-white">{String(item.name)}</strong><p className="mt-1 font-mono text-[8px] text-gray-600">{item.id}</p></div><Status value={item.status} /></div><dl className="mt-4"><Row label="Scope" value={item.scope} /><Row label="Permissions" value={item.permissions} /><Row label="Access owner" value={item.owner} /><Row label="Review note" value={item.notes} /></dl></article>)}</section>
  </>;
};

const UsersWorkspace = ({ version, run }: Props) => {
  const users = useMemo(() => aglErpRepository.list('users'), [version]);
  const roles = useMemo(() => aglErpRepository.list('roles'), [version]);
  const locations = useMemo(() => aglErpRepository.list('locations'), [version]);
  const privilegedRoleIds = useMemo(() => new Set(roles.filter((item) => String(item.permissions).toLowerCase().includes('administer')).map((item) => item.id)), [roles]);
  const [values, setValues] = useState({ name: '', email: '', phone: '', roleId: roles[0]?.id ?? '', locationId: locations[0]?.id ?? '', employeeId: '' });
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SemanticMetric icon={<Users size={15} />} label="User accounts" value={users.length} detail="Tenant-scoped identities" /><SemanticMetric icon={<Check size={15} />} label="Active access" value={users.filter((item) => item.status === 'Active').length} detail="Can enter the ERP" /><SemanticMetric icon={<ShieldCheck size={15} />} label="Administrators" value={users.filter((item) => item.status === 'Active' && privilegedRoleIds.has(String(item.roleId))).length} detail="Protected privileged identities" /><SemanticMetric icon={<KeyRound size={15} />} label="Access setup due" value={users.filter((item) => String(item.credentialState).toLowerCase().includes('pending')).length} detail="Invitation or password action" /></section>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.createUser(actor, values), 'User invitation created and audited.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-3"><Field label="Full name"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field><Field label="Email"><input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></Field><Field label="Phone"><input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} /></Field><Field label="Employee ID"><input value={values.employeeId} onChange={(e) => setValues({ ...values, employeeId: e.target.value })} /></Field><Field label="Role"><select value={values.roleId} onChange={(e) => setValues({ ...values, roleId: e.target.value })}>{roles.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></Field><Field label="Location"><select value={values.locationId} onChange={(e) => setValues({ ...values, locationId: e.target.value })}><option value="">All locations</option>{locations.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></Field><button className="min-h-10 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Invite user</button></form>
    <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-4 py-3 text-[9px] leading-4 text-amber-100/80">Role changes take effect against the shared identity record and are written to Admin Audit. The signed-in recovery administrator cannot change or suspend its own role, and the final active administrator cannot be removed.</div>
    <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1180px] text-left text-[10px]"><thead className="border-b border-white/[0.08] text-gray-600"><tr>{['User', 'Contact', 'Employee', 'Role', 'Location', 'Credential', 'Last login', 'Status', 'Actions'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300"><td className="px-4 py-4"><strong className="text-white">{String(item.name)}</strong><div className="font-mono text-[8px] text-gray-600">{item.id}</div></td><td className="px-4 py-4">{String(item.email ?? '—')}<div>{String(item.phone ?? '')}</div></td><td className="px-4 py-4">{String(item.employeeId ?? item.reference ?? '—')}</td><td className="px-4 py-4"><select aria-label={`Role for ${String(item.name)}`} value={String(item.roleId ?? '')} onChange={(event) => run(() => aglAdministrationWorkflow.setUserRole(actor, item, event.target.value), `${item.id} role updated and audited.`)} className="h-9 min-w-40 rounded-lg border border-white/[0.08] bg-black/30 px-2 text-[9px] text-gray-200"><option value="">Unassigned</option>{roles.filter((role) => role.status === 'Active').map((role) => <option key={role.id} value={role.id}>{String(role.name)}</option>)}</select><div className="mt-1 font-mono text-[8px] text-gray-600">{String(item.roleScope ?? 'No scope')}</div></td><td className="px-4 py-4">{String(item.locationName ?? 'All')}</td><td className="px-4 py-4">{String(item.credentialState ?? 'Active')}</td><td className="px-4 py-4">{item.lastLoginAt ? new Date(String(item.lastLoginAt)).toLocaleString() : 'Never'}</td><td className="px-4 py-4"><Status value={item.status} /></td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => run(() => aglAdministrationWorkflow.resetUserAccess(actor, item), (code) => `One-time access code: ${String(code)}. It is shown once in this beta.`)} className="rounded border border-white/[0.08] px-2 py-1 text-[8px]">Reset</button><button disabled={String(item.email).toLowerCase() === 'admin@aglops.test'} onClick={() => run(() => aglAdministrationWorkflow.setUserStatus(actor, item, item.status === 'Active' ? 'Archived' : 'Active'), `${item.id} access state changed.`)} className="rounded border border-white/[0.08] px-2 py-1 text-[8px] disabled:cursor-not-allowed disabled:opacity-30">{item.status === 'Active' ? 'Suspend' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>
  </>;
};

const Locations = ({ version, run }: Props) => {
  const records = useMemo(() => aglErpRepository.listAll('locations'), [version]);
  const [values, setValues] = useState({
    name: '',
    code: '',
    level: 'site' as 'country' | 'city' | 'branch' | 'site',
    parentId: 'BRANCH-GH-ACC',
    address: '',
    manager: '',
    phone: '',
  });
  const parentLevel = ({ country: '', city: 'country', branch: 'city', site: 'branch' } as const)[values.level];
  const parents = records.filter((item) => item.level === parentLevel);
  const pathFor = (item: AglOperationalRecord) => [
    item.country,
    item.city,
    item.branchName,
    item.siteName,
  ].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(' / ');
  const rank = { country: 0, city: 1, branch: 2, site: 3 };
  const ordered = [...records].sort((left, right) => (
    (rank[String(left.level) as keyof typeof rank] ?? 9) - (rank[String(right.level) as keyof typeof rank] ?? 9)
    || pathFor(left).localeCompare(pathFor(right))
  ));
  return <>
    <section className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.035] p-4">
      <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-300">Organisational ownership model</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-cyan-50/70">
        {['Tenant · AGL', 'Country', 'City', 'Branch', 'Operating site'].map((label, index) => <span key={label} className="flex items-center gap-2"><span className="rounded border border-cyan-300/10 bg-black/20 px-2 py-1">{label}</span>{index < 4 && <span className="text-cyan-300/30">→</span>}</span>)}
      </div>
    </section>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.createLocation(actor, values), 'Organisational unit registered and audited.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Unit type"><select value={values.level} onChange={(event) => { const level = event.target.value as typeof values.level; const expected = ({ country: '', city: 'country', branch: 'city', site: 'branch' } as const)[level]; const parentId = records.find((item) => item.level === expected)?.id ?? ''; setValues({ ...values, level, parentId }); }}>{['country', 'city', 'branch', 'site'].map((value) => <option key={value} value={value}>{value === 'site' ? 'Operating site' : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></Field>
      <Field label="Parent unit"><select disabled={!parentLevel} value={values.parentId} onChange={(event) => setValues({ ...values, parentId: event.target.value })}>{!parentLevel && <option value="">AGL tenant root</option>}{parents.map((item) => <option key={item.id} value={item.id}>{pathFor(item) || String(item.name)}</option>)}</select></Field>
      <Field label="Unit name"><input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="East Legon" /></Field>
      <Field label="Code"><input value={values.code} onChange={(event) => setValues({ ...values, code: event.target.value.toUpperCase() })} placeholder="ACC-EL" /></Field>
      <Field label="Address"><input value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} /></Field>
      <Field label="Manager"><input value={values.manager} onChange={(event) => setValues({ ...values, manager: event.target.value })} /></Field>
      <Field label="Phone"><input value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></Field>
      <button className="min-h-11 self-end rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Add organisational unit</button>
    </form>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ordered.map((item) => <article key={item.id} className={`rounded-xl border bg-[#090909] p-5 ${item.level === 'site' ? 'border-cyan-300/15' : 'border-white/[0.08]'}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><MapPin size={17} className="text-cyan-300" /><div><strong className="text-sm text-white">{String(item.name)}</strong><p className="mt-1 font-mono text-[8px] text-gray-600">{String(item.code ?? item.reference)}</p></div></div><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[7px] uppercase text-gray-500">{String(item.level)}</span></div><div className="mt-4 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2 font-mono text-[8px] text-cyan-100/65">{pathFor(item)}</div><dl className="mt-3"><Row label="Address" value={item.address} /><Row label="Manager" value={item.manager ?? item.owner} /><Row label="Timezone" value={item.timezone} /></dl></article>)}
    </section>
  </>;
};

const LegacyLocations = ({ version, run }: Props) => {
  const records = useMemo(() => aglErpRepository.list('locations'), [version]);
  const [values, setValues] = useState({ name: '', code: '', city: 'Accra', country: 'Ghana', address: '', manager: '', phone: '' });
  return <><form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.createLocation(actor, values), 'Branch/location registered.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Location"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field><Field label="Code"><input value={values.code} onChange={(e) => setValues({ ...values, code: e.target.value.toUpperCase() })} /></Field><Field label="City"><input value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} /></Field><Field label="Country"><input value={values.country} onChange={(e) => setValues({ ...values, country: e.target.value })} /></Field><Field label="Address"><input value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} /></Field><Field label="Manager"><input value={values.manager} onChange={(e) => setValues({ ...values, manager: e.target.value })} /></Field><Field label="Phone"><input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} /></Field><button className="min-h-11 self-end rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Add location</button></form><section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{records.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-center gap-3"><MapPin size={17} className="text-cyan-300" /><div><strong className="text-sm text-white">{String(item.name)}</strong><p className="font-mono text-[8px] text-gray-600">{String(item.code ?? item.reference)}</p></div></div><dl className="mt-4"><Row label="Address" value={item.address} /><Row label="City / country" value={`${String(item.city ?? '—')} · ${String(item.country ?? '—')}`} /><Row label="Manager" value={item.manager ?? item.owner} /><Row label="Timezone" value={item.timezone} /></dl></article>)}</section></>;
};
void LegacyLocations;

const Integrations = ({ version, run }: Props) => {
  const records = useMemo(() => aglErpRepository.list('integrations'), [version]);
  const [values, setValues] = useState({ name: '', category: 'Communications', endpoint: '', environment: 'Sandbox', owner: 'Systems administrator' });
  return <><div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-[10px] leading-5 text-amber-100">This frontend beta records configuration metadata and health state only. API keys and secrets stay outside browser storage and will be supplied by the separate backend during wiring.</div><form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.configureIntegration(actor, values), 'Integration metadata registered without persisting a secret.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-5"><Field label="Integration"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field><Field label="Category"><select value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })}>{['Communications', 'Payments', 'Calendar', 'Maps', 'Storage', 'AI', 'Identity'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Endpoint / account"><input value={values.endpoint} onChange={(e) => setValues({ ...values, endpoint: e.target.value })} /></Field><Field label="Environment"><select value={values.environment} onChange={(e) => setValues({ ...values, environment: e.target.value })}><option>Sandbox</option><option>Production</option></select></Field><button className="min-h-11 self-end rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Register integration</button></form><section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{records.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between"><Zap size={17} className="text-cyan-300" /><Status value={item.status} /></div><h2 className="mt-4 text-sm text-white">{String(item.name)}</h2><dl className="mt-4"><Row label="Category" value={item.category} /><Row label="Environment" value={item.environment} /><Row label="Endpoint" value={item.endpoint} /><Row label="Secret" value={item.secretState} /><Row label="Health checked" value={item.lastHealthCheckAt} /></dl><div className="mt-4 flex gap-2"><button onClick={() => run(() => aglAdministrationWorkflow.setIntegrationStatus(actor, item.id, 'Active'), `${item.id} health check passed.`)} className="rounded border border-emerald-300/20 px-3 py-2 text-[8px] text-emerald-300">Test / activate</button><button onClick={() => run(() => aglAdministrationWorkflow.setIntegrationStatus(actor, item.id, 'Archived'), `${item.id} disabled.`)} className="rounded border border-white/[0.08] px-3 py-2 text-[8px] text-gray-500">Disable</button></div></article>)}</section></>;
};

const SettingsWorkspace = ({ version, run }: Props) => {
  const stored = useMemo(() => aglErpRepository.listAll('settings').find((item) => item.reference === 'AGL-TENANT-CONFIG'), [version]);
  const [values, setValues] = useState({
    businessName: String(stored?.businessName ?? 'Automobiles Ghana Limited'),
    legalEntityName: String(stored?.legalEntityName ?? 'Automobiles Ghana Limited'),
    tenantCode: String(stored?.tenantCode ?? 'AGL'),
    timezone: String(stored?.timezone ?? 'Africa/Accra'),
    dateFormat: String(stored?.dateFormat ?? 'DD/MM/YYYY'),
    sessionTimeoutMinutes: Number(stored?.sessionTimeoutMinutes ?? 30),
    auditRetentionYears: Number(stored?.auditRetentionYears ?? 7),
    backupFrequency: String(stored?.backupFrequency ?? 'Daily'),
    requireMfa: Boolean(stored?.requireMfa ?? true),
    allowPasswordLogin: Boolean(stored?.allowPasswordLogin ?? true),
  });
  return <form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.saveSettings(actor, values), 'Technical tenant settings saved and audited.'); }} className="space-y-5">
    <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
      <h2 className="flex items-center gap-2 text-sm text-white"><Building2 size={15} className="text-cyan-300" /> Tenant identity & locale</h2>
      <p className="mt-2 text-[10px] text-gray-600">Identity and rendering defaults used across the whole AGL tenant.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Display name"><input value={values.businessName} onChange={(event) => setValues({ ...values, businessName: event.target.value })} /></Field>
        <Field label="Legal entity"><input value={values.legalEntityName} onChange={(event) => setValues({ ...values, legalEntityName: event.target.value })} /></Field>
        <Field label="Tenant code"><input value={values.tenantCode} onChange={(event) => setValues({ ...values, tenantCode: event.target.value.toUpperCase() })} /></Field>
        <Field label="Default timezone"><select value={values.timezone} onChange={(event) => setValues({ ...values, timezone: event.target.value })}>{['Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg'].map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Date format"><select value={values.dateFormat} onChange={(event) => setValues({ ...values, dateFormat: event.target.value })}>{['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'].map((value) => <option key={value}>{value}</option>)}</select></Field>
      </div>
    </section>
    <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
      <h2 className="flex items-center gap-2 text-sm text-white"><Settings size={15} className="text-cyan-300" /> Security, retention & continuity</h2>
      <p className="mt-2 text-[10px] text-gray-600">Technical rules that apply to every department. Financial, payroll, workshop, and inventory rules live in their owning modules.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Session timeout (minutes)"><input type="number" min="5" value={values.sessionTimeoutMinutes} onChange={(event) => setValues({ ...values, sessionTimeoutMinutes: Number(event.target.value) })} /></Field>
        <Field label="Audit retention (years)"><input type="number" min="1" value={values.auditRetentionYears} onChange={(event) => setValues({ ...values, auditRetentionYears: Number(event.target.value) })} /></Field>
        <Field label="Backup frequency"><select value={values.backupFrequency} onChange={(event) => setValues({ ...values, backupFrequency: event.target.value })}>{['Every 6 hours', 'Daily', 'Weekly'].map((value) => <option key={value}>{value}</option>)}</select></Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <CheckToggle label="Require MFA" value={values.requireMfa} onChange={(requireMfa) => setValues({ ...values, requireMfa })} />
        <CheckToggle label="Allow password login" value={values.allowPasswordLogin} onChange={(allowPasswordLogin) => setValues({ ...values, allowPasswordLogin })} />
      </div>
    </section>
    <button className="flex min-h-11 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-[10px] font-semibold text-black"><Save size={14} /> Save technical settings</button>
  </form>;
};

const LegacySettingsWorkspace = ({ version, run }: Props) => {
  const stored = useMemo(() => aglErpRepository.list('settings').find((item) => item.reference === 'AGL-TENANT-CONFIG'), [version]);
  const [values, setValues] = useState({
    businessName: String(stored?.businessName ?? 'Automobiles Ghana Limited'),
    timezone: String(stored?.timezone ?? 'Africa/Accra'),
    currency: String(stored?.currency ?? 'GHS'),
    taxRate: Number(stored?.taxRate ?? 15),
    nhilRate: Number(stored?.nhilRate ?? 2.5),
    getfundRate: Number(stored?.getfundRate ?? 2.5),
    workdayStart: String(stored?.workdayStart ?? '08:00'),
    overtimeAfterHours: Number(stored?.overtimeAfterHours ?? 8),
    lowStockThreshold: Number(stored?.lowStockThreshold ?? 3),
    requireEstimateApproval: Boolean(stored?.requireEstimateApproval ?? true),
    requireQcBeforeRelease: Boolean(stored?.requireQcBeforeRelease ?? true),
  });
  return <form onSubmit={(event) => { event.preventDefault(); run(() => aglAdministrationWorkflow.saveSettings(actor, values), 'Tenant settings saved and audited.'); }} className="space-y-5">
    <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><h2 className="flex items-center gap-2 text-sm text-white"><Building2 size={15} className="text-cyan-300" /> Business identity & locale</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Business name"><input value={values.businessName} onChange={(e) => setValues({ ...values, businessName: e.target.value })} /></Field><Field label="Timezone"><select value={values.timezone} onChange={(e) => setValues({ ...values, timezone: e.target.value })}>{['Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Currency"><select value={values.currency} onChange={(e) => setValues({ ...values, currency: e.target.value })}>{['GHS', 'NGN', 'USD', 'EUR'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Workday start"><input type="time" value={values.workdayStart} onChange={(e) => setValues({ ...values, workdayStart: e.target.value })} /></Field></div></section>
    <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><h2 className="flex items-center gap-2 text-sm text-white"><Settings size={15} className="text-cyan-300" /> Finance & operating controls</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Field label="VAT %"><input type="number" step=".1" value={values.taxRate} onChange={(e) => setValues({ ...values, taxRate: Number(e.target.value) })} /></Field><Field label="NHIL %"><input type="number" step=".1" value={values.nhilRate} onChange={(e) => setValues({ ...values, nhilRate: Number(e.target.value) })} /></Field><Field label="GETFund %"><input type="number" step=".1" value={values.getfundRate} onChange={(e) => setValues({ ...values, getfundRate: Number(e.target.value) })} /></Field><Field label="Overtime after hours"><input type="number" value={values.overtimeAfterHours} onChange={(e) => setValues({ ...values, overtimeAfterHours: Number(e.target.value) })} /></Field><Field label="Low-stock threshold"><input type="number" value={values.lowStockThreshold} onChange={(e) => setValues({ ...values, lowStockThreshold: Number(e.target.value) })} /></Field></div><div className="mt-4 flex flex-wrap gap-4"><CheckToggle label="Estimate approval required" value={values.requireEstimateApproval} onChange={(requireEstimateApproval) => setValues({ ...values, requireEstimateApproval })} /><CheckToggle label="QC before vehicle release" value={values.requireQcBeforeRelease} onChange={(requireQcBeforeRelease) => setValues({ ...values, requireQcBeforeRelease })} /></div></section>
    <button className="flex min-h-11 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-[10px] font-semibold text-black"><Save size={14} /> Save governed settings</button>
  </form>;
};
void LegacySettingsWorkspace;

const titles: Record<ModuleId, string> = { roles: 'Roles & permissions', users: 'User administration', locations: 'Branches & locations', integrations: 'Integration registry', settings: 'ERP settings' };
const descriptions: Record<ModuleId, string> = {
  roles: 'Define operating scope and explicit permissions. This is an access-control register, not a financial ledger.',
  users: 'Invite, assign, suspend, and reset tenant identities while retaining an administrator audit trail.',
  locations: 'Register the physical facilities, managers, addresses, and timezone boundaries that own operational records.',
  integrations: 'Control integration metadata, environment, health, and activation without exposing browser-stored secrets.',
  settings: 'Maintain technical tenant-wide identity, security, retention, session, and continuity defaults. Business rules stay with the department that owns them.',
};
const SemanticMetric = ({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="flex items-center gap-2 text-cyan-300">{icon}<span className="font-mono text-[8px] uppercase tracking-wider">{label}</span></div><div className="mt-3 text-xl font-display text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-white/[0.08] [&>input]:bg-black/30 [&>input]:px-3 [&>input]:text-xs [&>input]:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-white/[0.08] [&>select]:bg-black/30 [&>select]:px-3 [&>select]:text-xs [&>select]:text-white">{children}</div></label>;
const Status = ({ value }: { value: unknown }) => <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2 py-1 text-[8px] text-cyan-200">{String(value)}</span>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2 text-[9px]"><dt className="text-gray-600">{label}</dt><dd className="max-w-[65%] text-right text-gray-300">{String(value ?? '—')}</dd></div>;
const CheckToggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) => <button type="button" onClick={() => onChange(!value)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[9px] ${value ? 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200' : 'border-white/[0.08] text-gray-600'}`}><span className={`flex h-4 w-4 items-center justify-center rounded ${value ? 'bg-emerald-300 text-black' : 'border border-white/20'}`}>{value && <Check size={11} />}</span>{label}</button>;
