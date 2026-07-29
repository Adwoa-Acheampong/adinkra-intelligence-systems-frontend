import React from 'react';
import { AlertTriangle, Clock3, LoaderCircle, LockKeyhole, SearchX } from 'lucide-react';

export type IntelligenceStateKind = 'loading' | 'empty' | 'error' | 'stale' | 'restricted';

const stateMeta: Record<IntelligenceStateKind, {
  title: string;
  detail: string;
  icon: React.ElementType;
  tone: string;
}> = {
  loading: {
    title: 'Reconstructing the claim',
    detail: 'The registered definition, contributors and evidence lineage are being assembled.',
    icon: LoaderCircle,
    tone: 'text-vertical-accent border-vertical-accent/20 bg-vertical-accent/[0.05]',
  },
  empty: {
    title: 'No registered claim matches',
    detail: 'Change the business question or clear the current domain filter.',
    icon: SearchX,
    tone: 'text-gray-400 border-white/[0.08] bg-white/[0.02]',
  },
  error: {
    title: 'The claim could not be reproduced',
    detail: 'A required source is unavailable. The last accepted value has not been substituted silently.',
    icon: AlertTriangle,
    tone: 'text-red-300 border-red-400/20 bg-red-400/[0.05]',
  },
  stale: {
    title: 'This claim is outside its freshness target',
    detail: 'Inspect the stale source before using the value for a material decision.',
    icon: Clock3,
    tone: 'text-amber-200 border-amber-400/20 bg-amber-400/[0.05]',
  },
  restricted: {
    title: 'Original evidence is restricted',
    detail: 'The aggregate may be visible, but this role cannot open the underlying employment or complaint record.',
    icon: LockKeyhole,
    tone: 'text-purple-200 border-purple-400/20 bg-purple-400/[0.05]',
  },
};

export const IntelligenceState: React.FC<{
  kind: IntelligenceStateKind;
  title?: string;
  detail?: string;
  compact?: boolean;
}> = ({ kind, title, detail, compact }) => {
  const meta = stateMeta[kind];
  const Icon = meta.icon;
  return (
    <div className={`rounded-xl border ${meta.tone} ${compact ? 'p-3' : 'p-6'}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div className="flex items-start gap-3">
        <Icon size={compact ? 14 : 18} className={kind === 'loading' ? 'animate-spin' : ''} />
        <div>
          <div className={`${compact ? 'text-[10px]' : 'text-sm'} font-medium text-current`}>{title || meta.title}</div>
          <div className={`mt-1 leading-relaxed text-current/60 ${compact ? 'text-[9px]' : 'text-xs'}`}>{detail || meta.detail}</div>
        </div>
      </div>
    </div>
  );
};
