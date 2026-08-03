import type React from 'react';
import { useState } from 'react';
import { BadgeCheck, Car, Check, ShieldAlert, Wrench, X } from 'lucide-react';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type { AglJobCardSnapshot, ServiceActor } from '../../erp/agl/serviceWorkflow';
import { aglServiceWorkflow } from '../../erp/agl/serviceWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 2,
});

interface Props {
  snapshot: AglJobCardSnapshot;
  actor: ServiceActor;
  onChanged: (confirmation: string) => void;
  onError: (error: string) => void;
}

export const AglQualityHandoverPanel = ({ snapshot, actor, onChanged, onError }: Props) => {
  const [outcome, setOutcome] = useState<'Pass' | 'Rework required'>('Pass');
  const [inspector, setInspector] = useState('Bekoe Adu Benjamin');
  const [roadTest, setRoadTest] = useState('Completed');
  const [notes, setNotes] = useState('');
  const [vehicleCleaned, setVehicleCleaned] = useState(false);
  const [handoverTest, setHandoverTest] = useState<'Passed' | 'Not required'>('Passed');
  const [supervisor, setSupervisor] = useState('Bekoe Adu Benjamin');
  const [careAdvice, setCareAdvice] = useState('');
  const [collectedBy, setCollectedBy] = useState(String(snapshot.job.customer ?? ''));
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [reopenApprover, setReopenApprover] = useState('');
  const [reopenEvidence, setReopenEvidence] = useState('');
  const recalls = aglErpRepository.list('recalls').filter((record) => (
    String(record.jobId ?? record.reference ?? '') === snapshot.job.id
  ));
  const totalRecallRemedyGhs = recalls.reduce((total, record) => (
    total + Number(record.penaltyGhs ?? record.amount ?? 0)
  ), 0);

  const run = (action: () => unknown, confirmation: string) => {
    try {
      action();
      onChanged(confirmation);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'The control could not be completed.');
    }
  };

  const isClosed = snapshot.job.status === 'Closed';
  const canRelease = snapshot.job.qcState === 'Pass'
    && snapshot.invoice?.status === 'Paid'
    && vehicleCleaned
    && Boolean(supervisor.trim())
    && Boolean(collectedBy.trim())
    && !isClosed;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Final quality control</h2>
        <p className="mt-2 text-[10px] leading-4 text-gray-600">A failed inspection returns the VSR to work. A pass still does not release the vehicle until payment and handover controls are complete.</p>
        <div className="mt-4 space-y-3">
          <Field label="Outcome"><select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option>Pass</option><option>Rework required</option></select></Field>
          <Field label="Inspector"><input value={inspector} onChange={(event) => setInspector(event.target.value)} /></Field>
          <Field label="Road test"><select value={roadTest} onChange={(event) => setRoadTest(event.target.value)}><option>Completed</option><option>Not required</option><option>Failed</option></select></Field>
          <Field label="Inspection notes"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Checks performed, observations, and sign-off notes…" /></Field>
          <button onClick={() => run(
            () => aglServiceWorkflow.completeQc(snapshot.job.id, actor, { outcome, inspector, roadTest, notes }),
            outcome === 'Pass' ? 'QC passed and retained against the VSR.' : 'QC failed and the VSR returned to work in progress.',
          )} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black"><BadgeCheck size={13} /> Record QC</button>
        </div>
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Inspection history</div>
          <div className="mt-3 space-y-2">
            {snapshot.inspections.map((inspection) => (
              <div key={inspection.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
                <div className="flex justify-between gap-3"><span className="text-[10px] text-gray-300">{inspection.id}</span><span className="font-mono text-[8px] uppercase text-gray-500">{inspection.status}</span></div>
                <div className="mt-1 text-[9px] text-gray-600">{String(inspection.owner)} · {String(inspection.roadTest ?? 'No road-test record')}</div>
              </div>
            ))}
            {!snapshot.inspections.length && <div className="text-[10px] text-gray-700">No QC inspection has been recorded.</div>}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="rounded-xl p-5">
        {isClosed ? (
          <CorrectionControl
            snapshot={snapshot}
            reason={reopenReason}
            approver={reopenApprover}
            evidence={reopenEvidence}
            onReason={setReopenReason}
            onApprover={setReopenApprover}
            onEvidence={setReopenEvidence}
            onReopen={() => run(
              () => aglServiceWorkflow.reopenJob(snapshot.job.id, actor, { reason: reopenReason, approver: reopenApprover, evidenceReference: reopenEvidence }),
              `${snapshot.job.id} reopened under an approved correction record.`,
            )}
          />
        ) : (
          <>
            <h2 className="text-sm font-medium text-white">Vehicle handover & release</h2>
            <p className="mt-2 text-[10px] leading-4 text-gray-600">This creates a separate handover record before the VSR is closed and the vehicle registry returns to active.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ControlState label="Quality passed" passed={snapshot.job.qcState === 'Pass'} detail={snapshot.job.qcInspector ? `Signed by ${String(snapshot.job.qcInspector)}` : 'Awaiting inspector'} />
              <ControlState label="Invoice settled" passed={snapshot.invoice?.status === 'Paid'} detail={snapshot.invoice ? `${snapshot.invoice.id} · ${String(snapshot.invoice.status)}` : 'Create invoice and take payment'} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-16 items-start gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-4 text-[10px] leading-4 text-gray-400">
                <input aria-label="Vehicle preparation complete" type="checkbox" checked={vehicleCleaned} onChange={(event) => setVehicleCleaned(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--theme-accent)]" />
                Vehicle cleaned, loose property checked, and presentation completed.
              </label>
              <Field label="Handover road test"><select value={handoverTest} onChange={(event) => setHandoverTest(event.target.value as typeof handoverTest)}><option>Passed</option><option>Not required</option></select></Field>
              <Field label="Supervisor sign-off"><input value={supervisor} onChange={(event) => setSupervisor(event.target.value)} /></Field>
              <Field label="Collected by"><input value={collectedBy} onChange={(event) => setCollectedBy(event.target.value)} /></Field>
              <Field label="Care advice"><textarea value={careAdvice} onChange={(event) => setCareAdvice(event.target.value)} placeholder="Run-in, warning signs, next service, warranty or return instructions…" /></Field>
              <Field label="Customer feedback"><textarea value={customerFeedback} onChange={(event) => setCustomerFeedback(event.target.value)} placeholder="Customer comments at collection…" /></Field>
            </div>
            <button
              disabled={!canRelease}
              onClick={() => run(
                () => aglServiceWorkflow.releaseVehicle(snapshot.job.id, actor, {
                  vehicleCleaned,
                  testDriveStatus: handoverTest,
                  supervisor,
                  careAdvice,
                  collectedBy,
                  customerFeedback,
                }),
                `${snapshot.job.id} handed over, released, and closed.`,
              )}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] text-xs font-medium text-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Car size={14} /> Record handover, release, and close
            </button>
            {!canRelease && <p className="mt-3 text-[9px] leading-4 text-gray-600">Release remains locked until QC passes, the invoice is paid, preparation is confirmed, and collection authority is recorded.</p>}
          </>
        )}
      </GlassPanel>

      <GlassPanel className="rounded-xl p-5 xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert size={15} className="text-amber-300" /> Recalls & remedy impact</div>
            <p className="mt-2 max-w-3xl text-[10px] leading-4 text-gray-600">Service recovery remains tied to the original VSR, responsible mechanics, financial remedy, and resolution evidence. It does not replace or erase the original job history.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-28 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Recall cases</div><div className="mt-1 text-sm text-white">{recalls.length}</div></div>
            <div className="min-w-36 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Remedy / penalty</div><div className="mt-1 text-sm text-amber-300">{money.format(totalRecallRemedyGhs)}</div></div>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
          {recalls.map((recall) => (
            <div key={recall.id} className="grid gap-3 border-b border-white/[0.06] bg-black/20 p-4 last:border-b-0 md:grid-cols-[0.7fr_1.5fr_1fr_0.8fr_0.7fr] md:items-start">
              <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Case</div><div className="mt-1 text-[10px] text-cyan-300">{recall.id}</div><div className="mt-1 text-[9px] text-gray-600">{formatDate(recall.lodgedAt ?? recall.createdAt)}</div></div>
              <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Reason & resolution</div><div className="mt-1 text-[10px] leading-4 text-gray-300">{String(recall.reason ?? recall.notes ?? 'Reason not recorded')}</div><div className="mt-1 text-[9px] leading-4 text-gray-600">{String(recall.resolution ?? 'Resolution remains open')}</div></div>
              <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Responsible mechanic(s)</div><div className="mt-1 text-[10px] text-gray-300">{String(recall.mechanicIds ?? 'Not attributed')}</div></div>
              <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Remedy / penalty</div><div className="mt-1 text-[10px] text-amber-300">{money.format(Number(recall.penaltyGhs ?? recall.amount ?? 0))}</div></div>
              <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">State</div><span className={`mt-1 inline-flex rounded px-2 py-1 font-mono text-[8px] uppercase ${String(recall.status).toLowerCase() === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{recall.status}</span></div>
            </div>
          ))}
          {!recalls.length && <div className="p-7 text-center text-[10px] text-gray-600">No recalls or financial penalties are recorded against this job.</div>}
        </div>
      </GlassPanel>
    </div>
  );
};

const formatDate = (value: unknown) => {
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleString('en-GB');
};

const CorrectionControl = ({
  snapshot, reason, approver, evidence, onReason, onApprover, onEvidence, onReopen,
}: {
  snapshot: AglJobCardSnapshot;
  reason: string;
  approver: string;
  evidence: string;
  onReason: (value: string) => void;
  onApprover: (value: string) => void;
  onEvidence: (value: string) => void;
  onReopen: () => void;
}) => (
  <>
    <h2 className="text-sm font-medium text-white">Closed-job correction control</h2>
    <p className="mt-2 text-[10px] leading-4 text-gray-600">The original handover remains immutable. Reopening creates a separate approved correction record and returns the vehicle to controlled work.</p>
    <div className="mt-4 space-y-3">
      <ControlState label="Original release" passed detail={`${String(snapshot.job.releasedAt ?? 'Recorded')} · ${String(snapshot.job.releasedBy ?? 'Unknown actor')}`} />
      <ControlState label="Handover retained" passed={snapshot.handovers.length > 0} detail={snapshot.handovers[0]?.id ? `${snapshot.handovers[0].id} · ${String(snapshot.handovers[0].collectedBy)}` : 'Legacy close without structured handover'} />
      <Field label="Correction reason"><textarea value={reason} onChange={(event) => onReason(event.target.value)} placeholder="What requires correction, and why the closed record must be reopened…" /></Field>
      <Field label="Named approver"><input value={approver} onChange={(event) => onApprover(event.target.value)} placeholder="Operations manager or authorized owner" /></Field>
      <Field label="Decision evidence"><input value={evidence} onChange={(event) => onEvidence(event.target.value)} placeholder="Complaint, approval note, inspection, or document reference" /></Field>
      <button disabled={!reason.trim() || !approver.trim() || !evidence.trim()} onClick={onReopen} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.08] text-xs font-medium text-amber-300 disabled:opacity-35"><Wrench size={14} /> Authorize correction and reopen</button>
    </div>
  </>
);

const ControlState = ({ label, passed, detail }: { label: string; passed: boolean; detail: string }) => (
  <div className={`flex min-h-16 items-start gap-3 rounded-lg border p-3 ${passed ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-white/[0.07] bg-black/20'}`}>
    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${passed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.04] text-gray-700'}`}>{passed ? <Check size={11} /> : <X size={11} />}</span>
    <span><span className="block text-[10px] text-gray-300">{label}</span><span className="mt-1 block text-[9px] leading-4 text-gray-600">{detail}</span></span>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>> }) => (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
    <div className="mt-2 [&_input]:h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/25 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_input]:outline-none [&_select]:h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-[#0b0b0b] [&_select]:px-3 [&_select]:text-xs [&_select]:text-white [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/25 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:text-white [&_textarea]:outline-none">
      {children}
    </div>
  </label>
);
