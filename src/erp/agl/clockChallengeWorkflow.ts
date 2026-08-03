export type AglClockChallenge = {
  tenantId: string;
  token: string;
  site: string;
  issuedAt: string;
  expiresAt: string;
};

const storageKey = 'agl_erp_clock_challenge_v1';
const lifetimeMs = 30_000;

const makeToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `clock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const read = (): AglClockChallenge | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '') as AglClockChallenge;
    if (!parsed?.token || !parsed.site || !parsed.expiresAt) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const parsePayload = (raw: string) => {
  const value = raw.trim();
  if (!value) throw new Error('Scan or paste the current AGL clock QR value.');
  if (value.startsWith('AGL-CLOCK|')) {
    const [, token, site, expiresAt, tenantId] = value.split('|');
    return { token, site, expiresAt, tenantId };
  }
  try {
    const url = new URL(value);
    return {
      token: url.searchParams.get('token') ?? url.searchParams.get('t') ?? '',
      site: url.searchParams.get('site') ?? '',
      expiresAt: url.searchParams.get('expiresAt') ?? '',
      tenantId: url.searchParams.get('tenant') ?? 'agl',
    };
  } catch {
    return { token: value, site: '', expiresAt: '', tenantId: 'agl' };
  }
};

export const aglClockChallengeWorkflow = {
  issue(site: string, tenantId = 'agl'): AglClockChallenge {
    if (!site.trim()) throw new Error('Choose a clock site before issuing a QR challenge.');
    const issuedAt = new Date();
    const challenge: AglClockChallenge = {
      tenantId,
      token: makeToken(),
      site: site.trim(),
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + lifetimeMs).toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(challenge));
    return challenge;
  },

  active() {
    return read();
  },

  payload(challenge: AglClockChallenge) {
    return ['AGL-CLOCK', challenge.token, challenge.site, challenge.expiresAt, challenge.tenantId].join('|');
  },

  verify(raw: string) {
    const scanned = parsePayload(raw);
    const active = read();
    if (!active) throw new Error('No active AGL clock challenge was found. Open the clock kiosk first.');
    if (new Date(active.expiresAt).getTime() <= Date.now()) throw new Error('This clock QR has expired. Scan the current kiosk code.');
    if (scanned.token !== active.token) throw new Error('This is not the active AGL clock challenge.');
    if (scanned.site && scanned.site !== active.site) throw new Error('The scanned challenge belongs to a different AGL site.');
    if (scanned.tenantId && scanned.tenantId !== active.tenantId) throw new Error('The scanned challenge belongs to a different tenant.');
    return active;
  },
};
