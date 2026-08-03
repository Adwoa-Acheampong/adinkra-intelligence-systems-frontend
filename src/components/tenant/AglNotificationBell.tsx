import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglCommunicationsWorkflow } from '../../erp/agl/communicationsWorkflow';

const actor = { name: 'AGL Administrator', role: 'ERP Administrator' };

export const AglNotificationBell = ({ basePath }: { basePath: string }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const records = useMemo(() => aglErpRepository.list('notifications'), [version]);
  const unread = records.filter((record) => !record.read);
  const visible = [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);
  const markRead = (recordId: string) => aglCommunicationsWorkflow.markNotification(actor, recordId, true);

  return <div className="relative">
    <button type="button" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} onClick={() => setOpen((value) => !value)} className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 transition hover:border-cyan-300/20 hover:text-cyan-300">
      <Bell size={14} />
      {unread.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-300 px-1 font-mono text-[7px] font-semibold text-black">{unread.length > 9 ? '9+' : unread.length}</span>}
    </button>
    {open && <section role="dialog" aria-label="AGL notifications" className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-cyan-300/15 bg-[#080b0c] shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
      <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3"><div><h2 className="text-xs text-white">Notifications</h2><p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-gray-700">{unread.length} unread · {records.length} retained</p></div>{unread.length > 0 && <button type="button" onClick={() => unread.forEach((record) => markRead(record.id))} className="text-[8px] text-cyan-300">Mark all read</button>}</header>
      <div className="max-h-[340px] overflow-y-auto p-2">{visible.length === 0 ? <p className="px-3 py-8 text-center text-[10px] text-gray-600">No operating notifications.</p> : visible.map((record) => <article key={record.id} className={`mb-1 flex gap-3 rounded-lg border p-3 last:mb-0 ${record.read ? 'border-white/[0.05] bg-white/[0.015]' : 'border-cyan-300/15 bg-cyan-300/[0.04]'}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${record.read ? 'bg-white/[0.04] text-gray-700' : 'bg-cyan-300/[0.1] text-cyan-300'}`}>{record.read ? <Check size={11} /> : <Bell size={11} />}</span><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-gray-200">{String(record.name)}</strong><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-gray-600">{String(record.notes ?? '')}</p><p className="mt-1 font-mono text-[7px] text-gray-800">{new Date(record.createdAt).toLocaleString()}</p></div>{!record.read && <button type="button" aria-label={`Mark ${String(record.name)} read`} onClick={() => markRead(record.id)} className="h-fit rounded border border-white/[0.07] px-2 py-1 text-[7px] text-gray-500">Read</button>}</article>)}</div>
      <button type="button" onClick={() => { setOpen(false); navigate(`${basePath}/erp/notifications`); }} className="flex w-full items-center justify-center gap-2 border-t border-white/[0.08] px-4 py-3 text-[9px] text-cyan-300"><ExternalLink size={11} /> Open notification centre</button>
    </section>}
  </div>;
};
