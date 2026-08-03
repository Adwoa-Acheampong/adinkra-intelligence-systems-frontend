import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Minus,
  Package,
  Pause,
  Play,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  aglCommercialWorkflow,
  type SaleLineInput,
} from '../../erp/agl/commercialWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const PARKED_KEY = 'adinkra_agl_pos_parked_v1';

interface ParkedSale {
  id: string;
  parkedAt: string;
  label: string;
  lines: SaleLineInput[];
  customer: string;
  customerPhone: string;
  channel: string;
  paymentMethod: string;
  salesRep: string;
  mechanic: string;
  discountPercent: number;
  taxPercent: number;
  notes: string;
}

const loadParked = (): ParkedSale[] => {
  try {
    return JSON.parse(window.localStorage.getItem(PARKED_KEY) ?? '[]') as ParkedSale[];
  } catch {
    return [];
  }
};

export const AglPointOfSaleWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<SaleLineInput[]>([]);
  const [customer, setCustomer] = useState('Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [channel, setChannel] = useState('Walk-in');
  const [paymentMethod, setPaymentMethod] = useState('MoMo');
  const [salesRep, setSalesRep] = useState('Yvonne Botchway');
  const [mechanic, setMechanic] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [parked, setParked] = useState<ParkedSale[]>(loadParked);
  const [lastSaleId, setLastSaleId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const parts = useMemo(() => aglErpRepository.list('parts'), [revision]);
  const customers = useMemo(() => aglErpRepository.list('customers'), [revision]);
  const staff = useMemo(() => aglErpRepository.list('employees').filter((employee) => employee.status === 'Active'), [revision]);
  const stock = useMemo(() => aglCommercialWorkflow.stock().map((position) => {
    const part = parts.find((item) => item.sku === position.sku);
    return {
      ...position,
      salePrice: Number(part?.salePrice ?? Number(position.unitCost ?? 0) * 1.35),
      fitment: part?.fitment ?? '',
    } as AglOperationalRecord & { salePrice: number; fitment: string | number | boolean };
  }), [parts, revision]);
  const filtered = stock.filter((item) => !query.trim() || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  const subtotal = cart.reduce((sum, line) => sum + line.quantity * line.unitPriceGhs, 0);
  const discount = subtotal * discountPercent / 100;
  const tax = (subtotal - discount) * taxPercent / 100;
  const total = subtotal - discount + tax;
  const lastReceipt = lastSaleId ? aglCommercialWorkflow.receipt(lastSaleId) : null;

  const saveParked = (next: ParkedSale[]) => {
    setParked(next);
    window.localStorage.setItem(PARKED_KEY, JSON.stringify(next));
  };
  const reset = () => {
    setCart([]);
    setCustomer('Walk-in');
    setCustomerPhone('');
    setChannel('Walk-in');
    setPaymentMethod('MoMo');
    setMechanic('');
    setDiscountPercent(0);
    setTaxPercent(0);
    setNotes('');
  };
  const add = (item: AglOperationalRecord) => {
    const available = Number(item.quantity ?? 0) - Number(item.reserved ?? 0);
    setCart((current) => {
      const existing = current.find((line) => line.sku === item.sku);
      if (existing) {
        if (existing.quantity >= available) {
          setError(`Only ${available} unreserved ${String(item.name)} unit(s) are available.`);
          return current;
        }
        return current.map((line) => line.sku === item.sku ? { ...line, quantity: line.quantity + 1 } : line);
      }
      return [...current, {
        stockId: item.id,
        sku: String(item.sku),
        name: String(item.name),
        quantity: 1,
        unitPriceGhs: Number(item.salePrice ?? item.unitCost ?? 0),
      }];
    });
  };
  const quantity = (sku: string, delta: number) => setCart((current) => current
    .map((line) => line.sku === sku ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line)
    .filter((line) => line.quantity > 0));
  const complete = () => {
    setError('');
    try {
      const sale = aglCommercialWorkflow.completeSale(actor, {
        lines: cart,
        customer,
        customerPhone,
        channel,
        paymentMethod,
        salesRep,
        mechanic,
        discountPercent,
        taxPercent,
        notes,
      });
      setLastSaleId(sale.id);
      setNotice(`${String(sale.reference)} completed. Sales, stock, payment, customer, and audit books were updated.`);
      reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The sale could not be completed.');
    }
  };
  const park = () => {
    if (!cart.length) return setError('Add a line before parking the sale.');
    const record: ParkedSale = {
      id: `PARK-${Date.now()}`,
      parkedAt: new Date().toISOString(),
      label: customer || `Cart ${parked.length + 1}`,
      lines: cart,
      customer,
      customerPhone,
      channel,
      paymentMethod,
      salesRep,
      mechanic,
      discountPercent,
      taxPercent,
      notes,
    };
    saveParked([record, ...parked]);
    reset();
    setNotice(`${record.label} parked for later.`);
  };
  const resume = (sale: ParkedSale) => {
    setCart(sale.lines);
    setCustomer(sale.customer);
    setCustomerPhone(sale.customerPhone);
    setChannel(sale.channel);
    setPaymentMethod(sale.paymentMethod);
    setSalesRep(sale.salesRep);
    setMechanic(sale.mechanic);
    setDiscountPercent(sale.discountPercent);
    setTaxPercent(sale.taxPercent);
    setNotes(sale.notes);
    saveParked(parked.filter((item) => item.id !== sale.id));
    setNotice(`${sale.label} resumed.`);
  };

  return (
    <div className="mx-auto max-w-[1900px] space-y-5 pb-12">
      <header className="agl-no-print flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><ShoppingCart size={13} /> {tenant.id.toUpperCase()} ERP / sales / point of sale</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">New sale</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Search or scan stock, assemble a customer cart, park and resume it, accept Ghana-first tender, then post one connected sale across inventory, finance, customer history, receipt, and audit.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={park} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><Pause size={14} /> Park sale</button>{lastReceipt && <button onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-4 text-xs font-semibold text-black"><Printer size={14} /> Receipt / PDF</button>}</div>
      </header>
      <div className="agl-no-print">{(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }}><X size={13} /></button></div>}</div>

      <div className="agl-no-print grid gap-5 2xl:grid-cols-[minmax(0,1fr)_470px]">
        <section className="space-y-4">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU, part, fitment, location, or scan code…" className="h-12 w-full rounded-xl border border-white/[0.1] bg-black/25 pl-11 pr-4 text-xs text-white placeholder:text-gray-700" autoFocus />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => {
              const available = Number(item.quantity ?? 0) - Number(item.reserved ?? 0);
              return <button key={item.id} onClick={() => add(item)} className="rounded-xl border border-white/[0.08] bg-[#090909] p-4 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.025]"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-gray-500"><Package size={15} /></span><span className={`font-mono text-[8px] ${available <= 3 ? 'text-amber-300' : 'text-emerald-300'}`}>{available} available</span></div><h2 className="mt-4 line-clamp-2 min-h-8 text-[11px] font-medium text-gray-200">{String(item.name)}</h2><div className="mt-2 font-mono text-[8px] text-cyan-300">{String(item.sku)}</div><p className="mt-2 line-clamp-2 min-h-8 text-[9px] leading-4 text-gray-600">{String(item.fitment || item.location)}</p><div className="mt-4 text-sm text-white">{money.format(Number(item.salePrice))}</div></button>;
            })}
          </div>
        </section>

        <aside className="h-fit space-y-4 2xl:sticky 2xl:top-0">
          <div className="rounded-xl border border-white/[0.08] bg-[#090909]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm text-white">Current cart</h2><p className="mt-1 text-[9px] text-gray-600">{cart.length} line(s)</p></div><ShoppingCart size={16} className="text-cyan-300" /></div>
            <div className="max-h-72 divide-y divide-white/[0.06] overflow-y-auto">
              {cart.map((line) => <div key={line.sku} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] text-gray-200">{line.name}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{line.sku}</div></div><button onClick={() => setCart((current) => current.filter((item) => item.sku !== line.sku))} className="text-gray-700 hover:text-red-300"><Trash2 size={13} /></button></div><div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3"><div className="flex items-center rounded-lg border border-white/[0.08]"><button onClick={() => quantity(line.sku, -1)} className="h-8 w-8 text-gray-500"><Minus size={11} className="mx-auto" /></button><span className="w-8 text-center font-mono text-[9px] text-white">{line.quantity}</span><button onClick={() => quantity(line.sku, 1)} className="h-8 w-8 text-gray-500"><Plus size={11} className="mx-auto" /></button></div><input type="number" min="0" value={line.unitPriceGhs} onChange={(event) => setCart((current) => current.map((item) => item.sku === line.sku ? { ...item, unitPriceGhs: Number(event.target.value) } : item))} className="h-8 min-w-0 rounded-lg border border-white/[0.08] bg-black/25 px-2 font-mono text-[9px] text-white" /><span className="font-mono text-[9px] text-gray-300">{money.format(line.quantity * line.unitPriceGhs)}</span></div></div>)}
              {!cart.length && <div className="p-10 text-center text-[10px] text-gray-700">Select stock to begin the sale.</div>}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5">
            <div className="grid grid-cols-2 gap-3"><Field label="Customer" value={customer} onChange={(value) => { setCustomer(value); const selectedCustomer = customers.find((item) => item.name === value); if (selectedCustomer) setCustomerPhone(String(selectedCustomer.phone ?? '')); }} options={['Walk-in', ...customers.map((item) => String(item.name))]} /><Field label="Phone" value={customerPhone} onChange={setCustomerPhone} /><Field label="Channel" value={channel} onChange={setChannel} options={['Walk-in', 'WhatsApp', 'Phone', 'Delivery', 'Online', 'Management']} /><Field label="Tender" value={paymentMethod} onChange={setPaymentMethod} options={['MoMo', 'Cash', 'POS', 'Bank transfer', 'Card', 'Credit']} /><Field label="Sales rep" value={salesRep} onChange={setSalesRep} options={Array.from(new Set(['Yvonne Botchway', ...staff.filter((item) => ['sales', 'management'].some((term) => String(item.department).toLowerCase().includes(term))).map((item) => String(item.name))]))} /><Field label="Mechanic (optional)" value={mechanic} onChange={setMechanic} options={['', ...staff.filter((item) => String(item.department).toLowerCase() === 'workshop').map((item) => String(item.name))]} /></div>
            <div className="grid grid-cols-2 gap-3"><NumberField label="Discount %" value={discountPercent} onChange={setDiscountPercent} /><NumberField label="Tax %" value={taxPercent} onChange={setTaxPercent} /></div>
            <Field label="Notes" value={notes} onChange={setNotes} />
            <div className="space-y-2 border-t border-white/[0.08] pt-4 text-[10px]"><Total label="Subtotal" value={subtotal} /><Total label="Discount" value={-discount} /><Total label="Tax" value={tax} /><div className="flex items-center justify-between border-t border-white/[0.08] pt-3"><span className="text-xs text-white">Total</span><span className="font-mono text-lg text-cyan-300">{money.format(total)}</span></div></div>
            <button disabled={!cart.length} onClick={complete} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black disabled:opacity-30">{paymentMethod === 'MoMo' ? <Smartphone size={14} /> : paymentMethod === 'Cash' ? <Banknote size={14} /> : paymentMethod === 'Credit' ? <CircleDollarSign size={14} /> : <CreditCard size={14} />} Complete sale</button>
          </div>

          {parked.length > 0 && <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><h2 className="text-sm text-white">Parked sales</h2><div className="mt-3 space-y-2">{parked.map((sale) => <div key={sale.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3"><div><div className="text-[10px] text-gray-300">{sale.label}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{sale.lines.length} lines · {new Date(sale.parkedAt).toLocaleTimeString()}</div></div><button onClick={() => resume(sale)} className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-300/20 px-3 text-[9px] text-cyan-300"><Play size={11} /> Resume</button></div>)}</div></div>}
        </aside>
      </div>

      {lastReceipt && <div className="hidden print:block"><Receipt receipt={lastReceipt} /></div>}
    </div>
  );
};

const Receipt = ({ receipt }: { receipt: ReturnType<typeof aglCommercialWorkflow.receipt> }) => (
  <article className="agl-print-root bg-white p-10 text-black">
    <div className="flex items-start justify-between border-b border-black/15 pb-6"><div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">AGL OPS</div><h1 className="mt-2 font-serif text-3xl font-bold">Sales receipt</h1><p className="mt-1 text-xs text-gray-500">Automobiles Ghana Limited · Accra, Ghana</p></div><div className="text-right font-mono text-xs"><div>{String(receipt.sale.reference)}</div><div className="mt-1 text-gray-500">{new Date(String(receipt.sale.createdAt)).toLocaleString()}</div></div></div>
    <div className="mt-6 grid grid-cols-2 gap-6 text-xs"><div><div className="text-[9px] font-bold uppercase text-gray-500">Customer</div><div className="mt-2">{String(receipt.sale.customer)}</div><div className="mt-1 text-gray-500">{String(receipt.sale.customerPhone ?? '')}</div></div><div className="text-right"><div className="text-[9px] font-bold uppercase text-gray-500">Tender</div><div className="mt-2">{String(receipt.sale.paymentMethod)}</div><div className="mt-1 text-gray-500">{String(receipt.sale.owner)}</div></div></div>
    <table className="mt-8 w-full border-collapse text-xs"><thead><tr className="border-b border-black/20 text-left text-[9px] uppercase text-gray-500"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Total</th></tr></thead><tbody>{receipt.lines.map((line) => <tr key={line.sku} className="border-b border-black/[0.07]"><td className="py-3">{line.name}<div className="mt-1 font-mono text-[9px] text-gray-500">{line.sku}</div></td><td className="py-3 text-right">{line.quantity}</td><td className="py-3 text-right">{money.format(line.unitPriceGhs)}</td><td className="py-3 text-right">{money.format(line.quantity * line.unitPriceGhs)}</td></tr>)}</tbody></table>
    <div className="ml-auto mt-6 max-w-xs space-y-2 text-xs"><Total label="Subtotal" value={Number(receipt.sale.subtotal ?? 0)} /><Total label="Discount" value={-Number(receipt.sale.discount ?? 0)} /><Total label="Tax" value={Number(receipt.sale.tax ?? 0)} /><div className="flex justify-between border-t border-black/20 pt-3 text-base font-bold"><span>Total</span><span>{money.format(Number(receipt.sale.amount ?? 0))}</span></div></div>
    <div className="mt-10 border-t border-black/15 pt-5 text-center text-[10px] text-gray-500">Thank you. This receipt is tied to sale {receipt.sale.id} and its immutable audit correlation.</div>
  </article>
);

const Field = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options?: string[] }) => <label><span className="font-mono text-[8px] uppercase text-gray-600">{label}</span>{options ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-xs text-white">{options.map((option) => <option key={option}>{option}</option>)}</select> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" />}</label>;
const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => <label><span className="font-mono text-[8px] uppercase text-gray-600">{label}</span><input type="number" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>;
const Total = ({ label, value }: { label: string; value: number }) => <div className="flex items-center justify-between"><span className="text-gray-500">{label}</span><span className="font-mono">{money.format(value)}</span></div>;
