import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Command as CommandIcon, Package, Plus, ReceiptText, Search, ShoppingCart, Sparkles, UserPlus, Users, Wrench } from 'lucide-react';
import { getAglErpModuleSections } from '../../config/routes';

interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  to: string;
  icon: ReactNode;
  keywords?: string;
}

const RECENT_KEY = 'adinkra-agl-command-palette-recent';

const loadRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; } catch { return []; }
};

const remember = (id: string) => {
  const next = [id, ...loadRecent().filter((item) => item !== id)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

const score = (command: PaletteCommand, query: string) => {
  if (!query.trim()) return 1;
  const needle = query.trim().toLowerCase();
  const label = command.label.toLowerCase();
  const haystack = `${label} ${command.group} ${command.keywords ?? ''}`.toLowerCase();
  if (label.startsWith(needle)) return 100;
  if (label.includes(needle)) return 60;
  if (haystack.includes(needle)) return 30;
  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return 10;
  }
  return 0;
};

export const AglCommandPalette = ({ basePath }: { basePath: string }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const commands = useMemo<PaletteCommand[]>(() => {
    const operational = getAglErpModuleSections().flatMap((section) => section.modules.map((module) => ({
      id: `erp-${module.path}`,
      label: module.name,
      group: `ERP · ${section.label}`,
      to: `${basePath}/erp/${module.path}`,
      icon: module.icon,
      keywords: `${section.label} operate create edit approve record`,
    })));
    const analytics: PaletteCommand[] = [
      ['overview', 'Analytics overview', <BarChart3 size={16} />, 'dashboard kpi best seller payment mix'],
      ['fixbot', 'FixBot analytics', <Sparkles size={16} />, 'diagnosis recommendation evidence'],
      ['workshop', 'Workshop analytics', <Wrench size={16} />, 'jobs bays throughput quality'],
      ['vehicles', 'Vehicle analytics', <Wrench size={16} />, 'fleet service history'],
      ['crm', 'Customer analytics', <Users size={16} />, 'crm retention value'],
      ['inventory', 'Inventory analytics', <Package size={16} />, 'stock seller margin movement'],
      ['sales', 'Sales analytics', <ShoppingCart size={16} />, 'revenue channel tender product'],
      ['finance', 'Finance analytics', <ReceiptText size={16} />, 'profit loss expense payment'],
      ['hr', 'Workforce analytics', <Users size={16} />, 'staff attendance payroll performance'],
      ['marketing', 'Marketing analytics', <BarChart3 size={16} />, 'campaign roas conversion'],
      ['reports', 'Analytical reports', <ReceiptText size={16} />, 'report evidence export'],
      ['settings', 'Analytics settings', <BarChart3 size={16} />, 'targets currency charts'],
    ].map(([path, label, icon, keywords]) => ({
      id: `analytics-${String(path)}`,
      label: String(label),
      group: 'Analytics',
      to: path === 'overview' ? `${basePath}/analytics` : `${basePath}/analytics/${String(path)}`,
      icon: icon as ReactNode,
      keywords: String(keywords),
    }));
    const actions: PaletteCommand[] = [
      { id: 'action-intake', label: 'Register customer and vehicle', group: 'Quick actions', to: `${basePath}/erp/intake`, icon: <UserPlus size={16} />, keywords: 'new customer vehicle intake' },
      { id: 'action-job', label: 'Create workshop job', group: 'Quick actions', to: `${basePath}/erp/job-board`, icon: <Wrench size={16} />, keywords: 'new work order job card' },
      { id: 'action-sale', label: 'Open new sale', group: 'Quick actions', to: `${basePath}/erp/new-sale`, icon: <ShoppingCart size={16} />, keywords: 'pos checkout receipt' },
      { id: 'action-part', label: 'Register inventory part', group: 'Quick actions', to: `${basePath}/erp/parts`, icon: <Package size={16} />, keywords: 'new sku stock' },
      { id: 'action-po', label: 'Create purchase order', group: 'Quick actions', to: `${basePath}/erp/purchase-orders`, icon: <Plus size={16} />, keywords: 'procurement supplier order' },
      { id: 'action-employee', label: 'Add employee', group: 'Quick actions', to: `${basePath}/erp/employees`, icon: <Users size={16} />, keywords: 'new staff salary hr' },
      { id: 'action-expense', label: 'Record expense', group: 'Quick actions', to: `${basePath}/erp/expenses`, icon: <ReceiptText size={16} />, keywords: 'finance cost payment' },
      { id: 'action-report', label: 'Generate report', group: 'Quick actions', to: `${basePath}/erp/business-reports`, icon: <BarChart3 size={16} />, keywords: 'sales performance report pdf' },
    ];
    return [...actions, ...analytics, ...operational];
  }, [basePath]);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      const toggle = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      const slash = event.key === '/' && !(event.target as HTMLElement | null)?.matches?.('input, textarea, select');
      if (toggle || slash) { event.preventDefault(); setOpen((value) => !value); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('agl-command-palette:open', openPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('agl-command-palette:open', openPalette); window.removeEventListener('keydown', onKeyDown); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const ranked = useMemo(() => {
    const recent = loadRecent();
    return commands
      .map((command) => ({ command, score: score(command, query), recent: recent.indexOf(command.id) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || (left.recent < 0 ? 99 : left.recent) - (right.recent < 0 ? 99 : right.recent))
      .map((item) => item.command);
  }, [commands, query]);

  const run = (command: PaletteCommand) => {
    remember(command.id);
    setOpen(false);
    navigate(command.to);
  };

  if (!open) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Search AGL pages and actions" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[100] flex justify-center bg-black/75 px-4 pt-[10vh] backdrop-blur-sm">
      <section className="flex h-fit max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#080b0c] shadow-[0_24px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-4">
          <Search size={17} className="shrink-0 text-cyan-300" />
          <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setCursor(0); }} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setCursor((value) => Math.min(ranked.length - 1, value + 1)); } else if (event.key === 'ArrowUp') { event.preventDefault(); setCursor((value) => Math.max(0, value - 1)); } else if (event.key === 'Enter') { event.preventDefault(); const command = ranked[cursor]; if (command) run(command); } }} placeholder="Search pages, actions, departments, or settings…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-700" />
          <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[9px] text-gray-600">ESC</kbd>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
          {ranked.length === 0 && <div className="px-4 py-10 text-center text-xs text-gray-600">No matching page or action.</div>}
          {ranked.map((command, index) => <button key={command.id} type="button" onMouseEnter={() => setCursor(index)} onClick={() => run(command)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${cursor === index ? 'bg-cyan-300/[0.09] text-cyan-100' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cursor === index ? 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300' : 'border-white/[0.07] bg-white/[0.02] text-gray-600'}`}>{command.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs">{command.label}</span><span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-wider text-gray-700">{command.group}</span></span><ArrowRight size={13} className="text-gray-700" /></button>)}
        </div>
        <footer className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 font-mono text-[8px] uppercase tracking-wider text-gray-700"><span className="flex items-center gap-1.5"><CommandIcon size={11} /> AGL command palette</span><span>↑↓ navigate · enter open · esc close</span></footer>
      </section>
    </div>,
    document.body,
  );
};
