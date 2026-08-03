import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, Clock3, FileCheck2, ShieldCheck, X } from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglFinanceWorkflow } from '../../erp/agl/financeWorkflow';
import { aglProcurementWorkflow } from '../../erp/agl/procurementWorkflow';
import { aglInventoryWorkflow } from '../../erp/agl/inventoryWorkflow';
import { aglAttendanceWorkflow } from '../../erp/agl/attendanceWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type QueueItem = { moduleId: string; record: AglOperationalRecord; decision: string; risk: string };

export const AglManagerDeskWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [approver, setApprover] = useState('Operations manager');
  const [basis, setBasis] = useState('');
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const queue = useMemo<QueueItem[]>(() => [
    ...aglErpRepository.list('expenses').filter((item) => item.status === 'Approval required').map((record) => ({ moduleId: 'expenses', record, decision: 'Approve expense', risk: 'Cash and P&L' })),
    ...aglErpRepository.list('petty-cash').filter((item) => item.status === 'Approval required').map((record) => ({ moduleId: 'petty-cash', record, decision: 'Approve cash custody', risk: 'Physical cash' })),
    ...aglErpRepository.list('purchase-orders').filter((item) => item.status === 'Approval required').map((record) => ({ moduleId: 'purchase-orders', record, decision: 'Approve supplier commitment', risk: 'Inventory and creditor' })),
    ...aglErpRepository.list('stock-counts').filter((item) => item.status === 'Approval required').map((record) => ({ moduleId: 'stock-counts', record, decision: 'Approve count variance', risk: 'Stock valuation' })),
    ...aglErpRepository.list('stock-transfers').filter((item) => item.status === 'Approval required').map((record) => ({ moduleId: 'stock-transfers', record, decision: 'Approve stock transfer', risk: 'Asset custody' })),
    ...aglErpRepository.list('leave').filter((item) => item.status === 'Pending').map((record) => ({ moduleId: 'leave', record, decision: 'Approve leave', risk: 'Capacity and payroll' })),
    ...aglErpRepository.list('manager-desk').filter((item) => item.status === 'Pending').map((record) => ({ moduleId: 'manager-desk', record, decision: 'Resolve manager assignment', risk: 'Management follow-through' })),
  ], [version]);
  const run = (item: QueueItem, action: 'approve' | 'reject') => {
    try {
      if (!approver.trim() || !basis.trim()) throw new Error('Named approver and decision basis are required.');
      if (action === 'reject') {
        aglErpRepository.changeStatus({ moduleId: item.moduleId, recordId: item.record.id, actorName: actor.name, actorRole: actor.role, status: item.moduleId === 'leave' ? 'Closed' : 'Rejected', values: { rejectedBy: approver, rejectionReason: basis, rejectedAt: new Date().toISOString() } });
      } else if (item.moduleId === 'expenses') aglFinanceWorkflow.approveExpense(item.record.id, actor, approver, basis);
      else if (item.moduleId === 'petty-cash') aglFinanceWorkflow.approvePettyCash(item.record.id, actor, approver, basis);
      else if (item.moduleId === 'purchase-orders') aglProcurementWorkflow.approve(item.record.id, actor, approver, basis);
      else if (item.moduleId === 'stock-counts') aglInventoryWorkflow.approveCount(item.record.id, actor, approver, basis);
      else if (item.moduleId === 'stock-transfers') aglInventoryWorkflow.approveTransfer(item.record.id, actor, approver, basis);
      else if (item.moduleId === 'leave') aglAttendanceWorkflow.approveLeave(actor, item.record.id, approver);
      else aglErpRepository.changeStatus({ moduleId: item.moduleId, recordId: item.record.id, actorName: actor.name, actorRole: actor.role, status: 'Approved', values: { approver, approvalBasis: basis, approvedAt: new Date().toISOString() } });
      setFeedback(`${item.record.id} ${action === 'approve' ? 'approved' : 'rejected'} with a retained decision basis.`);
      setBasis('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The decision failed.');
    }
  };
  const totalValue = queue.reduce((sum, item) => sum + Number(item.record.amount ?? 0), 0);
  return <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
    <header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / CROSS-DEPARTMENT DECISIONS</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Manager desk</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">One approval queue over finance, procurement, inventory custody, leave, and management assignments. Each decision still runs the owning department’s rules.</p></header>
    {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')}><X size={13} /></button></div>}
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={<Clock3 size={15} />} label="Decisions waiting" value={queue.length} detail="Across governed operating modules" /><Metric icon={<FileCheck2 size={15} />} label="Value exposed" value={`GHS ${totalValue.toLocaleString()}`} detail="Financial amount where applicable" /><Metric icon={<ShieldCheck size={15} />} label="Functions represented" value={new Set(queue.map((item) => item.moduleId)).size} detail="Rules stay with their source function" /></section>
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-3">{queue.map((item) => <article key={`${item.moduleId}-${item.record.id}`} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{item.moduleId.replace(/-/g, ' ')}</div><h2 className="mt-2 text-sm text-white">{String(item.record.name ?? item.record.id)}</h2><p className="mt-1 font-mono text-[8px] text-gray-600">{item.record.id} · {String(item.record.reference ?? 'No external reference')}</p></div><span className="rounded-full border border-amber-300/20 px-2 py-1 text-[8px] text-amber-200">{item.decision}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><Fact label="Owner / requester" value={item.record.owner ?? item.record.requestedBy} /><Fact label="Value" value={item.record.amount ? `GHS ${Number(item.record.amount).toLocaleString()}` : 'Non-financial'} /><Fact label="Evidence" value={item.record.evidenceReference ?? item.record.reference} /><Fact label="Decision risk" value={item.risk} /></div><div className="mt-4 flex gap-2"><button onClick={() => run(item, 'approve')} className="rounded-lg bg-emerald-300 px-4 py-2 text-[9px] font-semibold text-black">Approve under source rules</button><button onClick={() => run(item, 'reject')} className="rounded-lg border border-red-300/20 px-4 py-2 text-[9px] text-red-300">Reject</button></div></article>)}{!queue.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center"><ClipboardCheck size={25} className="mx-auto text-gray-700" /><p className="mt-3 text-xs text-gray-500">No management decisions are waiting.</p></div>}</div><aside className="h-fit rounded-xl border border-white/[0.08] bg-[#090909] p-5 xl:sticky xl:top-0"><h2 className="text-sm text-white">Decision authority</h2><p className="mt-2 text-[10px] leading-5 text-gray-500">The approver cannot be the original owner where segregation of duties applies. The basis is copied into the source record and Admin Audit.</p><div className="mt-5 space-y-3"><Field label="Named approver"><input value={approver} onChange={(event) => setApprover(event.target.value)} /></Field><Field label="Decision / rejection basis"><textarea value={basis} onChange={(event) => setBasis(event.target.value)} /></Field></div></aside></section>
  </div>;
};

const Metric = ({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="flex items-center gap-2 text-cyan-300">{icon}<span className="font-mono text-[8px] uppercase tracking-wider">{label}</span></div><div className="mt-3 text-xl font-display text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Fact = ({ label, value }: { label: string; value: unknown }) => <div className="rounded-lg border border-white/[0.05] bg-black/20 p-3"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 text-[10px] text-gray-300">{String(value ?? '—')}</div></div>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/30 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/30 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:text-white">{children}</div></label>;
