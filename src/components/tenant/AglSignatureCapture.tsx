import { useEffect, useRef, useState } from 'react';
import { Check, Eraser, PenTool, Type } from 'lucide-react';

export const AglSignatureCapture = ({
  value,
  onCapture,
  label = 'Signature',
}: {
  value: string | null;
  onCapture: (dataUrl: string | null) => void;
  label?: string;
}) => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#111111';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, [mode]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    lastRef.current = point(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const next = point(event);
    context.beginPath();
    context.moveTo(lastRef.current.x, lastRef.current.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    lastRef.current = next;
  };
  const commitDraw = () => {
    drawingRef.current = false;
    lastRef.current = null;
    if (canvasRef.current) onCapture(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#111111';
      context.lineWidth = 2;
    }
    setTyped('');
    onCapture(null);
  };
  const commitTyped = () => {
    if (!typed.trim()) {
      onCapture(null);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111111';
    context.font = 'italic 56px Georgia, serif';
    context.textBaseline = 'middle';
    context.fillText(typed.trim(), 24, canvas.height / 2);
    onCapture(canvas.toDataURL('image/png'));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-black/20 p-0.5">
          <button type="button" onClick={() => setMode('draw')} className={`flex min-h-8 items-center gap-1 rounded-md px-2 text-[9px] ${mode === 'draw' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}><PenTool size={11} /> Draw</button>
          <button type="button" onClick={() => setMode('type')} className={`flex min-h-8 items-center gap-1 rounded-md px-2 text-[9px] ${mode === 'type' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}><Type size={11} /> Type</button>
        </div>
      </div>
      {mode === 'draw' ? (
        <>
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={commitDraw}
            onPointerCancel={commitDraw}
            className="mt-2 w-full touch-none cursor-crosshair rounded-lg border border-white/[0.1] bg-white"
            style={{ aspectRatio: '600 / 160' }}
          />
          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={clear} className="flex items-center gap-1 text-[9px] text-gray-500 hover:text-red-300"><Eraser size={11} /> Clear</button>
            {value && <span className="flex items-center gap-1 text-[9px] text-emerald-300"><Check size={11} /> Captured</span>}
          </div>
        </>
      ) : (
        <div className="mt-2">
          <input value={typed} onChange={(event) => setTyped(event.target.value)} onBlur={commitTyped} placeholder="Type signatory name" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 font-serif text-base italic text-white" />
          <p className="mt-2 text-[9px] text-gray-700">Typed signature is captured when the field loses focus.</p>
        </div>
      )}
    </div>
  );
};
