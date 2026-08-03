import type React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BarChart3, ClipboardCheck, DatabaseZap, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tenant } from '../../types';

export const TenantSystemChooser = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}`;
  const erpAvailable = tenant.id === 'agl' && tenant.verticalId === 'autos';

  return (
    <div className="min-h-screen bg-[#050505] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <button
          onClick={() => navigate(`/${tenant.verticalId}/tenants`)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-gray-500 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"
        >
          <ArrowLeft size={15} /> Back to {tenant.verticalId} tenants
        </button>

        <header className="mt-10 max-w-4xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-vertical-accent">Tenant systems · {tenant.id.toUpperCase()}</div>
          <h1 className="mt-4 text-4xl font-display font-semibold tracking-tight sm:text-5xl">{tenant.name}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-gray-400">
            Choose whether you want to operate the company or investigate the data its operations generate.
            The systems share record identities, but they do different work.
          </p>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <SystemDoor
            eyebrow="Explain and investigate"
            title="Analytics"
            description="Preserves the current AGL analytical system: visual comparisons, diagnostic performance, departmental measures, evidence drills, and governed insights."
            bullets={['Explore and compare performance', 'Drill from metrics to contributing evidence', 'Keep the current analytical build intact']}
            icon={<BarChart3 size={26} />}
            accent="cyan"
            onOpen={() => navigate(`${basePath}/analytics`)}
            action="Open Analytics"
          />
          <SystemDoor
            eyebrow="Create and control records"
            title="ERP"
            description="Runs the company: customers, vehicles, jobs, stock, sales, finance, people, documents, approvals, and the audited actions that change them."
            bullets={['Work directly in operational ledgers', 'Create, edit, approve, progress, and close records', 'Record every mutation in the Admin Audit Log']}
            icon={<ClipboardCheck size={26} />}
            accent="red"
            onOpen={() => erpAvailable && navigate(`${basePath}/erp/work-orders`)}
            action={erpAvailable ? 'Open ERP' : 'ERP pattern follows AGL'}
            disabled={!erpAvailable}
          />
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/[0.08] pt-6 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <DatabaseZap size={16} className="mt-0.5 text-vertical-accent" />
            <div><div className="text-xs text-gray-200">One operational source</div><p className="mt-1 text-[10px] leading-4 text-gray-600">ERP records are the source. Analytics consumes governed projections without becoming the place where records are changed.</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <History size={16} className="mt-0.5 text-vertical-accent" />
            <div><div className="text-xs text-gray-200">One accountable actor trail</div><p className="mt-1 text-[10px] leading-4 text-gray-600">Authorized users work inside the same ERP. Login and mutation history identifies who did what and when.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemDoor = ({
  eyebrow,
  title,
  description,
  bullets,
  icon,
  accent,
  onOpen,
  action,
  disabled = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
  accent: 'cyan' | 'red';
  onOpen: () => void;
  action: string;
  disabled?: boolean;
}) => {
  const color = accent === 'red'
    ? 'border-red-400/25 bg-red-500/[0.05] text-red-300'
    : 'border-cyan-400/25 bg-cyan-500/[0.05] text-cyan-300';
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -3 }}
      className={`group relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border p-7 text-left transition focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default disabled:opacity-50 sm:p-9 ${color}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
      <div className="flex items-start justify-between gap-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-80">{eyebrow}</div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-current/25 bg-black/20">{icon}</div>
      </div>
      <div className="mt-12 text-4xl font-display font-semibold tracking-tight text-white">{title}</div>
      <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">{description}</p>
      <ul className="mt-7 space-y-2 pb-7 text-xs text-gray-400">
        {bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />{bullet}</li>)}
      </ul>
      <div className="mt-auto flex w-full items-center justify-between border-t border-current/15 pt-5 text-xs font-medium">
        <span>{action}</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  );
};
