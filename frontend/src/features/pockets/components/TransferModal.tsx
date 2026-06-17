import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/solid';
import { usePockets, useTransfer } from '../hooks/usePockets';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import FloatSelect from '../../../shared/components/FloatSelect';
import FloatCurrency from '../../../shared/components/FloatCurrency';
import FloatInput from '../../../shared/components/FloatInput';
import FloatDatePicker from '../../../shared/components/FloatDatePicker';
import { formatCurrency, cn } from '../../../core/utils/format';

interface TransferModalProps {
  sourcePocketId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TransferResult {
  sourceName: string;
  sourceBefore: number;
  sourceAfter: number;
  targetName: string;
  targetBefore: number;
  targetAfter: number;
  amount: number;
}

const TransferModal: React.FC<TransferModalProps> = ({ sourcePocketId, isOpen, onClose }) => {
  const { data: pockets } = usePockets();
  const { mutate: transfer, isPending } = useTransfer();
  const sourcePocket = pockets?.find((p) => p.id === sourcePocketId);

  const maxAmount = sourcePocket?.accumulatedAmount || 0;

  // ── Success state + animation ──
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (!transferResult) {
      setAnimPhase(0);
      return;
    }
    const t = setTimeout(() => setAnimPhase(1), 500);
    return () => { clearTimeout(t); };
  }, [transferResult]);

  const handleCloseSuccess = () => {
    setTransferResult(null);
    onClose();
  };

  // ── Schema ──
  const transferSchema = useMemo(() => z.object({
    targetPocketId: z.string().min(1, 'El bolsillo destino es requerido'),
    amount: z
      .number({ required_error: 'El monto es requerido' })
      .positive('El monto debe ser positivo')
      .max(maxAmount, `El monto no puede exceder $${maxAmount.toFixed(2)}`),
    reason: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)'),
  }), [maxAmount]);

  type TransferFormData = z.infer<typeof transferSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      targetPocketId: '',
      amount: 0,
      reason: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedAmount = watch('amount');
  const watchedTargetId = watch('targetPocketId');
  const watchedReason = watch('reason');
  const watchedDate = watch('date');

  const targetPocket = pockets?.find((p) => p.id === watchedTargetId);

  const targetOptions = useMemo(() => {
    if (!pockets) return [];
    return pockets
      .filter((p) => p.id !== sourcePocketId)
      .map((p) => ({
        label: `${p.name}  —  ${formatCurrency(p.accumulatedAmount)}`,
        value: p.id,
      }));
  }, [pockets, sourcePocketId]);

  // ── Submit → capture result → show success ──
  const onSubmit = (data: TransferFormData) => {
    const targetAtSubmit = pockets?.find((p) => p.id === data.targetPocketId);
    if (!sourcePocket || !targetAtSubmit) return;

    transfer(
      { ...data, sourcePocketId },
      {
        onSuccess: () => {
          setTransferResult({
            sourceName: sourcePocket.name,
            sourceBefore: sourcePocket.accumulatedAmount,
            sourceAfter: sourcePocket.accumulatedAmount - data.amount,
            targetName: targetAtSubmit.name,
            targetBefore: targetAtSubmit.accumulatedAmount,
            targetAfter: targetAtSubmit.accumulatedAmount + data.amount,
            amount: data.amount,
          });
          reset();
        },
      },
    );
  };

  // ═══════════════════════════════════════════
  // SUCCESS VIEW (post-transfer animation)
  // ═══════════════════════════════════════════
  if (transferResult) {
    const r = transferResult;
    return (
      <><style>{`
        @keyframes badge-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(21,128,61,0.25)); }
          50% { filter: drop-shadow(0 0 14px rgba(21,128,61,0.45)); }
        }
      `}</style>
      <Modal isOpen={isOpen} onClose={handleCloseSuccess} showCloseButton={false} glassBackdrop glass>
        <div className="space-y-5 relative">
          {/* ═══ Head: ✅ Transferido (aparece en fase 2) ═══ */}
          {animPhase >= 1 && (
            <div className="flex justify-center pt-4 animate-[badge-enter_0.4s_ease-out]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30
                border border-green-200 dark:border-green-800/40 shadow-sm animate-[badge-glow_2s_ease-in-out_infinite]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Transferido
              </span>
            </div>
          )}

          {/* ═══ CAPI + Names + Current Balances ═══ */}
          <div className={`flex items-center justify-center gap-4 select-none ${animPhase >= 1 ? 'pt-2' : 'pt-8'}`}>
            {/* ── Source ── */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32">
                {/* Neon glow — red */}
                <div
                  className="absolute inset-0 rounded-full dark:hidden"
                  style={{
                    background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 50%)',
                    transform: 'scale(1.4)',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full hidden dark:block"
                  style={{
                    background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 50%)',
                    transform: 'scale(1.4)',
                  }}
                />
                <img
                  src="/assets/CAPI_Pocket.png"
                  alt={r.sourceName}
                  className="relative w-full h-full object-cover [mask-image:radial-gradient(circle,black_60%,transparent_75%)] shadow-lg dark:invert [.dim_&]:opacity-70"
                />
              </div>
              <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300 text-center leading-tight max-w-[120px]">
                {r.sourceName}
              </span>
            </div>

            {/* ═══ Transfer Icon ═══ */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0 shadow-md drop-shadow-[0_0_8px_rgba(147,51,234,0.35)]">
              <ArrowsRightLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>

            {/* ── Target ── */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32">
                {/* Neon glow — green */}
                <div
                  className="absolute inset-0 rounded-full dark:hidden"
                  style={{
                    background: 'radial-gradient(circle, rgba(22,163,74,0.5) 0%, transparent 50%)',
                    transform: 'scale(1.4)',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full hidden dark:block"
                  style={{
                    background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 50%)',
                    transform: 'scale(1.4)',
                  }}
                />
                <img
                  src="/assets/CAPI_Pocket.png"
                  alt={r.targetName}
                  className="relative w-full h-full object-cover scale-x-[-1] [mask-image:radial-gradient(circle,black_60%,transparent_75%)] shadow-lg dark:invert [.dim_&]:opacity-70"
                />
              </div>
              <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300 text-center leading-tight max-w-[120px]">
                {r.targetName}
              </span>
            </div>
          </div>

          {/* ═══ Balance Cards (fase 2+) ═══ */}
          <div
            className={cn(
              'grid grid-cols-2 gap-3 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              animPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
            )}
          >
            {/* ── Source Card ── */}
            <div className="rounded-xl px-3 py-3 border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-950/30 text-center">

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-red-500 dark:text-red-400">
                  Antes: <span className="text-xs font-bold text-red-600">{formatCurrency(r.sourceBefore)}</span>
                </span>
                <span className="text-red-500 font-bold text-xs flex items-center gap-1 drop-shadow-[0_0_3px_rgba(239,68,68,0.3)]">
                  <span className="text-sm">↓</span> -{formatCurrency(r.amount)}
                </span>
                <span className="text-xs text-red-500 dark:text-red-400">
                  Ahora: <span className="text-base font-extrabold text-red-700 dark:text-red-400 drop-shadow-[0_0_4px_rgba(185,28,28,0.3)]">{formatCurrency(r.sourceAfter)}</span>
                </span>
              </div>
            </div>

            {/* ── Target Card ── */}
            <div className="rounded-xl px-3 py-3 border border-green-200 dark:border-green-500/20 bg-green-50/60 dark:bg-green-950/30 text-center">

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-green-500 dark:text-green-400">
                  Antes: <span className="text-xs font-bold text-green-600">{formatCurrency(r.targetBefore)}</span>
                </span>
                <span className="text-green-500 font-bold text-xs flex items-center gap-1 drop-shadow-[0_0_3px_rgba(34,197,94,0.3)]">
                  <span className="text-sm">↑</span> +{formatCurrency(r.amount)}
                </span>
                <span className="text-xs text-green-500 dark:text-green-400">
                  Ahora: <span className="text-base font-extrabold text-green-700 dark:text-green-400 drop-shadow-[0_0_4px_rgba(21,128,61,0.3)]">{formatCurrency(r.targetAfter)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Close button with X icon ═══ */}
          <div className="flex justify-center pb-1">
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-8 h-8 flex items-center justify-center rounded-full text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 hover:scale-110 hover:rotate-90 transition-all duration-300"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Modal></>
    );
  }

  // ═══════════════════════════════════════════
  // FORM VIEW
  // ═══════════════════════════════════════════
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ═══ De ↔️ Para Header ═══ */}
        <div className="flex items-center gap-3 pt-2 pb-1 select-none">
          {/* Source */}
          <div className="flex-1 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-0.5">
              De
            </div>
            <div className="text-sm font-bold text-secondary-900 dark:text-white">
              {sourcePocket?.name || '—'}
            </div>
            <div className="text-[11px] text-secondary-500 dark:text-secondary-400">
              {formatCurrency(maxAmount)}
            </div>
          </div>

          {/* Transfer icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
            <ArrowsRightLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>

          {/* Target */}
          <div className="flex-1 text-left">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-0.5">
              Para
            </div>
            {targetPocket ? (
              <>
                <div className="text-sm font-bold text-secondary-900 dark:text-white">
                  {targetPocket.name}
                </div>
                <div className="text-[11px] text-secondary-500 dark:text-secondary-400">
                  {formatCurrency(targetPocket.accumulatedAmount)}
                </div>
              </>
            ) : (
              <div className="text-sm text-secondary-400 dark:text-secondary-500 italic">
                Seleccionar destino
              </div>
            )}
          </div>
        </div>

        <div>
          <FloatSelect
            label="Bolsillo Destino"
            accent="pocket"
            options={targetOptions}
            error={errors.targetPocketId?.message}
            value={watchedTargetId}
            helperText={
              targetPocket
                ? `Saldo actual del destino: ${formatCurrency(targetPocket.accumulatedAmount)}`
                : undefined
            }
            {...register('targetPocketId')}
          />
        </div>

        <div className="space-y-4">
            <FloatCurrency
              label="Monto"
              accent="pocket"
              currency="COP"
              value={watchedAmount}
              onChange={(val) => setValue('amount', val, { shouldValidate: true })}
              error={errors.amount?.message}
              helperText={`Disponible para transferir: ${formatCurrency(maxAmount)}`}
              fullWidth
            />
            <FloatInput
              label="Motivo"
              accent="pocket"
              error={errors.reason?.message}
              value={watchedReason}
              fullWidth
              {...register('reason')}
            />
            <FloatDatePicker
              label="Fecha"
              accent="pocket"
              error={errors.date?.message}
              value={watchedDate}
              fullWidth
              {...register('date')}
            />
          </div>

        {/* ═══ Actions ═══ */}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Transferir
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;
