import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';
import { upsertAglOrgUnit } from './operatingScope';

export interface AdministrationActor {
  name: string;
  role: string;
}

const requireText = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} is required.`);
};

const permissions = ['view', 'create', 'edit', 'approve', 'post', 'export', 'administer'] as const;
export type PermissionKey = typeof permissions[number];
export const AGL_PERMISSION_KEYS = permissions;

export const aglAdministrationWorkflow = {
  createRole(actor: AdministrationActor, values: { name: string; scope: string; permissions: PermissionKey[]; owner: string; notes: string }) {
    requireText(values.name, 'Role name');
    if (!values.permissions.length) throw new Error('Assign at least one permission.');
    const duplicate = aglErpRepository.list('roles').some((item) => String(item.name).toLowerCase() === values.name.trim().toLowerCase());
    if (duplicate) throw new Error('A role with this name already exists.');
    return aglErpRepository.create({
      moduleId: 'roles',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, permissions: values.permissions.join(' · '), reference: `ROLE-${String(Date.now()).slice(-6)}` },
    });
  },

  createUser(actor: AdministrationActor, values: { name: string; email: string; phone: string; roleId: string; locationId: string; employeeId: string }) {
    requireText(values.name, 'User name');
    requireText(values.email, 'Email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) throw new Error('Enter a valid email address.');
    const duplicate = aglErpRepository.list('users').some((item) => String(item.email).toLowerCase() === values.email.toLowerCase());
    if (duplicate) throw new Error('A user already exists with this email.');
    const role = aglErpRepository.list('roles').find((item) => item.id === values.roleId);
    const location = aglErpRepository.list('locations').find((item) => item.id === values.locationId);
    return aglErpRepository.create({
      moduleId: 'users',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        roleName: role?.name ?? 'Unassigned',
        locationName: location?.name ?? 'All locations',
        credentialState: 'Invitation pending',
        mfa: false,
        lastLoginAt: '',
        owner: actor.name,
        reference: values.employeeId || `USR-${String(Date.now()).slice(-6)}`,
      },
    });
  },

  setUserStatus(actor: AdministrationActor, record: AglOperationalRecord, status: string) {
    if (String(record.email) === 'admin@aglops.test' && status !== 'Active') {
      throw new Error('The recovery administrator cannot be suspended from this workspace.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'users',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: {},
    });
  },

  setUserRole(actor: AdministrationActor, record: AglOperationalRecord, roleId: string) {
    const roles = aglErpRepository.list('roles');
    const nextRole = roles.find((item) => item.id === roleId && item.status === 'Active');
    if (!nextRole) throw new Error('Select an active operating role.');
    if (record.roleId === roleId) return record;

    const currentRole = roles.find((item) => item.id === record.roleId);
    const currentIsAdministrator = String(currentRole?.permissions ?? '').toLowerCase().includes('administer');
    const nextIsAdministrator = String(nextRole.permissions ?? '').toLowerCase().includes('administer');
    const isCurrentActor = String(record.name).toLowerCase() === actor.name.toLowerCase()
      || String(record.email).toLowerCase() === 'admin@aglops.test';
    if (isCurrentActor) throw new Error('You cannot change your own administrator role from this session.');

    if (currentIsAdministrator && !nextIsAdministrator) {
      const administratorRoleIds = new Set(roles
        .filter((item) => item.status === 'Active' && String(item.permissions).toLowerCase().includes('administer'))
        .map((item) => item.id));
      const remainingAdministrators = aglErpRepository.list('users').filter((item) => (
        item.id !== record.id
        && item.status === 'Active'
        && administratorRoleIds.has(String(item.roleId))
      ));
      if (!remainingAdministrators.length) throw new Error('Promote another active administrator before changing the last administrator role.');
    }

    const updated = aglErpRepository.update({
      moduleId: 'users',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        roleId: nextRole.id,
        roleName: nextRole.name,
        roleScope: nextRole.scope,
        roleChangedAt: new Date().toISOString(),
        roleChangedBy: actor.name,
      },
    });
    aglErpRepository.recordAction({
      moduleId: 'users',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPROVE',
      summary: `Changed ${String(record.name)} access from ${String(record.roleName ?? 'Unassigned')} to ${String(nextRole.name)} (${String(nextRole.scope)}).`,
    });
    return updated;
  },

  resetUserAccess(actor: AdministrationActor, record: AglOperationalRecord) {
    const temporaryCode = `AGL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    aglErpRepository.update({
      moduleId: 'users',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        credentialState: 'Temporary access issued',
        accessResetAt: new Date().toISOString(),
        mustChangePassword: true,
      },
    });
    aglErpRepository.recordAction({
      moduleId: 'users',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPROVE',
      summary: `Issued a one-time access reset for ${String(record.email)}.`,
    });
    return temporaryCode;
  },

  createLocation(actor: AdministrationActor, values: {
    name: string;
    code: string;
    level?: 'country' | 'city' | 'branch' | 'site';
    parentId?: string;
    city?: string;
    country?: string;
    address: string;
    manager: string;
    phone: string;
  }) {
    requireText(values.name, 'Location name');
    requireText(values.code, 'Location code');
    const locations = aglErpRepository.listAll('locations');
    const duplicate = locations.some((item) => String(item.code).toLowerCase() === values.code.toLowerCase());
    if (duplicate) throw new Error('Location code already exists.');
    const level = values.level ?? 'site';
    const parent = locations.find((item) => item.id === (values.parentId ?? 'BRANCH-GH-ACC'));
    const expectedParent: Record<typeof level, string | undefined> = {
      country: undefined,
      city: 'country',
      branch: 'city',
      site: 'branch',
    };
    if (expectedParent[level] && (!parent || parent.level !== expectedParent[level])) {
      throw new Error(`Select a ${expectedParent[level]} parent for this ${level}.`);
    }
    const country = level === 'country' ? values.name : String(parent?.country ?? values.country ?? '');
    const countryCode = level === 'country' ? values.code.toUpperCase() : String(parent?.countryCode ?? '');
    const city = level === 'city' ? values.name : String(parent?.city ?? values.city ?? '');
    const created = aglErpRepository.create({
      moduleId: 'locations',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        level,
        parentId: level === 'country' ? '' : String(parent?.id ?? ''),
        country,
        countryCode,
        city,
        branchId: level === 'site' ? String(parent?.id ?? '') : '',
        branchName: level === 'branch' ? values.name : String(parent?.branchName ?? parent?.name ?? ''),
        siteId: '',
        siteName: level === 'site' ? values.name : '',
        reference: values.code.toUpperCase(),
        owner: values.manager,
        timezone: countryCode === 'NG' ? 'Africa/Lagos' : 'Africa/Accra',
      },
    });
    if (level === 'branch') {
      const updated = aglErpRepository.update({
        moduleId: 'locations',
        recordId: created.id,
        actorName: actor.name,
        actorRole: actor.role,
        values: { branchId: created.id, branchName: values.name },
      });
      upsertAglOrgUnit(updated);
      return updated;
    }
    if (level === 'site') {
      const updated = aglErpRepository.update({
        moduleId: 'locations',
        recordId: created.id,
        actorName: actor.name,
        actorRole: actor.role,
        values: { siteId: created.id, siteName: values.name },
      });
      upsertAglOrgUnit(updated);
      return updated;
    }
    upsertAglOrgUnit(created);
    return created;
  },

  configureIntegration(actor: AdministrationActor, values: { name: string; category: string; endpoint: string; environment: string; owner: string }) {
    requireText(values.name, 'Integration name');
    return aglErpRepository.create({
      moduleId: 'integrations',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        reference: `INT-${String(Date.now()).slice(-6)}`,
        secretState: 'Managed outside browser',
        lastHealthCheckAt: '',
        owner: values.owner,
        notes: 'Credentials are intentionally not retained in frontend local state.',
      },
    });
  },

  setIntegrationStatus(actor: AdministrationActor, recordId: string, status: string) {
    return aglErpRepository.changeStatus({
      moduleId: 'integrations',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: { lastHealthCheckAt: new Date().toISOString() },
    });
  },

  saveSettings(actor: AdministrationActor, values: Record<string, string | number | boolean>) {
    const existing = aglErpRepository.list('settings').find((item) => item.reference === 'AGL-TENANT-CONFIG');
    if (existing) {
      return aglErpRepository.update({
        moduleId: 'settings',
        recordId: existing.id,
        actorName: actor.name,
        actorRole: actor.role,
        values: { ...values, name: 'AGL tenant configuration', owner: actor.name },
      });
    }
    return aglErpRepository.create({
      moduleId: 'settings',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, name: 'AGL tenant configuration', reference: 'AGL-TENANT-CONFIG', owner: actor.name },
    });
  },
};
