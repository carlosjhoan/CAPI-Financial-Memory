import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/solid';
import { usePockets, useTransfer, useUpdateTransfer } from '../hooks/usePockets';
import type { Pocket, TransferDto, UpdateTransferDto } from '../types/pocket.types';
import Modal from '../../../shared/components/Modal';
import FloatSelect from '../../../shared/components/FloatSelect';
import FloatCurrency from '../../../shared/components/FloatCurrency';
import FloatInput from '../../../shared/components/FloatInput';
import FormStepIndicator from '../../../shared/components/forms/FormStepIndicator';
import StepActions from '../../../shared/components/forms/StepActions';
import { formatCurrency, cn } from '../../../core/utils/format';

interface TransferModalProps {
  sourcePocketId: string;
  isOpen: boolean;
  onClose: () => void;
  editTransfer?: {
    id: string;
    targetPocketId: string;
    amount: number;
    reason: string;
  } | null;
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

const STEPS_CREATE = [
  { label: 'Destino', fields: ['targetPocketId'] as const },
  { label: 'Monto a transferir', fields: ['amount', 'reason'] as const },
];

const TransferModal: React.FC<TransferModalProps> = ({ sourcePocketId, isOpen, onClose, editTransfer }) => {
  const isEditMode = !!editTransfer;
  const { data: pockets } = usePockets();
  const { mutate: transfer, isPending: isTransferPending } = useTransfer();
  const { mutate: updateTransfer, isPending: isUpdatePending } = useUpdateTransfer();
  const isPending = isTransferPending || isUpdatePending;

  const sourcePocket = pockets?.find((p) => p.id === sourcePocketId);
  const maxAmount = useMemo(() => {
    if (!sourcePocket) return 0;
    // In edit mode: accumulated already has old transfer deducted, reverse it
    if (isEditMode && editTransfer) {
      return sourcePocket.accumulatedAmount + editTransfer.amount;
    }
    return sourcePocket.accumulatedAmount || 0;
  }, [sourcePocket, isEditMode, editTransfer]);

  const [currentStep, setCurrentStep] = useState(0);

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

  const handleClose = () => {
    reset();
    setCurrentStep(0);
    onClose();
  };

  // ── Schema ──
  const transferSchema = useMemo(() => {
    if (isEditMode) {
      return z.object({
        targetPocketId: z.string().min(1),
        amount: z
          .number({ required_error: 'El monto es requerido' })
          .min(0, 'El monto no puede ser negativo')
          .max(maxAmount, `El monto no puede exceder ${formatCurrency(maxAmount)}`),
        reason: z.string().trim().min(10, 'El motivo debe tener al menos 10 caracteres').max(50, 'El motivo no puede superar 50 caracteres'),
      });
    }
    return z.object({
      targetPocketId: z.string().min(1, 'El bolsillo destino es requerido'),
      amount: z
        .number({ required_error: 'El monto es requerido' })
        .min(0, 'El monto no puede ser negativo')
        .max(maxAmount, `El monto no puede exceder ${formatCurrency(maxAmount)}`),
      reason: z.string().trim().min(10, 'El motivo debe tener al menos 10 caracteres').max(50, 'El motivo no puede superar 50 caracteres'),
    });
  }, [maxAmount, isEditMode]);

  type TransferFormData = z.infer<typeof transferSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: useMemo(() => ({
      targetPocketId: editTransfer?.targetPocketId || '',
      amount: editTransfer?.amount || 0,
      reason: editTransfer?.reason || '',
    }), [editTransfer?.targetPocketId, editTransfer?.amount, editTransfer?.reason]),
    mode: 'onChange',
    delayError: 2000,
  });

  // Reset form when editTransfer changes (modal re-opens for a different transfer)
  useEffect(() => {
    if (isOpen) {
      reset({
        targetPocketId: editTransfer?.targetPocketId || '',
        amount: editTransfer?.amount || 0,
        reason: editTransfer?.reason || '',
      });
      setCurrentStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editTransfer?.targetPocketId, editTransfer?.amount, editTransfer?.reason]);

  const [goalOverflow, setGoalOverflow] = useState<{
    targetPocket: Pocket;
    wouldBeAccumulated: number;
    pendingData: TransferDto | { transferId: string; data: UpdateTransferDto };
    isEdit: boolean;
  } | null>(null);

  const watchedAmount = watch('amount');
  const watchedTargetId = watch('targetPocketId');
  const watchedReason = watch('reason');

  const targetPocket = pockets?.find((p) => p.id === (editTransfer?.targetPocketId || watchedTargetId));

  const targetOptions = useMemo(() => {
    if (!pockets || isEditMode) return [];
    return pockets
      .filter((p) => p.id !== sourcePocketId)
      .map((p) => ({
        label: p.name,
        value: p.id,
      }));
  }, [pockets, sourcePocketId, isEditMode]);

  const isLastStep = currentStep === STEPS_CREATE.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const stepFields = STEPS_CREATE[currentStep].fields;
    return trigger(stepFields as unknown as ('targetPocketId' | 'amount' | 'reason')[]);
  };

  const handleContinue = async () => {
    if (isLastStep) {
      handleSubmit(handleFormSubmit)();
      return;
    }
    const valid = await validateStep();
    if (!valid) return;
    setCurrentStep((s) => s + 1);
  };

  const handleGoBack = () => {
    setCurrentStep((s) => s - 1);
  };

  // ── Submit ──
  const handleFormSubmit = (data: TransferFormData) => {
    if (!sourcePocket) return;

    if (isEditMode && editTransfer) {
      const targetAtSubmit = pockets?.find((p) => p.id === editTransfer.targetPocketId);
      if (!targetAtSubmit) return;

      // Goal pre-check: new accumulated = current - oldAmount + newAmount
      // targetPocket.accumulatedAmount includes the old transfer
      const wouldBeAccumulated = targetAtSubmit.accumulatedAmount - editTransfer.amount + data.amount;
      if (targetAtSubmit.type === 'goal' && targetAtSubmit.goal > 0 && wouldBeAccumulated > targetAtSubmit.goal) {
        setGoalOverflow({
          targetPocket: targetAtSubmit,
          wouldBeAccumulated,
          pendingData: {
            transferId: editTransfer.id,
            data: { amount: data.amount, reason: data.reason },
          },
          isEdit: true,
        });
        return;
      }

      // No overflow → update directly
      updateTransfer(
        { transferId: editTransfer.id, data: { amount: data.amount, reason: data.reason } },
        {
          onSuccess: () => {
            setTransferResult({
              sourceName: sourcePocket.name,
              sourceBefore: sourcePocket.accumulatedAmount,
              sourceAfter: sourcePocket.accumulatedAmount - (data.amount - editTransfer.amount),
              targetName: targetAtSubmit.name,
              targetBefore: targetAtSubmit.accumulatedAmount,
              targetAfter: targetAtSubmit.accumulatedAmount - editTransfer.amount + data.amount,
              amount: data.amount,
            });
            reset();
            setCurrentStep(0);
          },
        },
      );
      return;
    }

    // ── Create mode ──
    const targetAtSubmit = pockets?.find((p) => p.id === data.targetPocketId);
    if (!targetAtSubmit) return;

    const wouldBeAccumulated = targetAtSubmit.accumulatedAmount + data.amount;
    if (targetAtSubmit.type === 'goal' && targetAtSubmit.goal > 0 && wouldBeAccumulated > targetAtSubmit.goal) {
      const transferData: TransferDto = {
        ...data,
        sourcePocketId,
        date: new Date().toISOString().split('T')[0],
      };
      setGoalOverflow({
        targetPocket: targetAtSubmit,
        wouldBeAccumulated,
        pendingData: transferData,
        isEdit: false,
      });
      return;
    }

    const transferData: TransferDto = {
      ...data,
      sourcePocketId,
      date: new Date().toISOString().split('T')[0],
    };
    transfer(transferData, {
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
        setCurrentStep(0);
      },
    });
  };

  const handleExtendGoal = () => {
    if (!goalOverflow) return;
    const newGoal = Math.max(
      goalOverflow.targetPocket.goal,
      Math.ceil(goalOverflow.wouldBeAccumulated),
    );

    if (goalOverflow.isEdit) {
      const pd = goalOverflow.pendingData as { transferId: string; data: UpdateTransferDto };
      setGoalOverflow(null);
      const targetAtSubmit = pockets?.find((p) => p.id === editTransfer!.targetPocketId);
      updateTransfer(
        { transferId: pd.transferId, data: { ...pd.data, newGoal } },
        {
          onSuccess: () => {
            setTransferResult({
              sourceName: sourcePocket?.name || '',
              sourceBefore: sourcePocket?.accumulatedAmount || 0,
              sourceAfter: (sourcePocket?.accumulatedAmount || 0) - (pd.data.amount - editTransfer!.amount),
              targetName: targetAtSubmit?.name || '',
              targetBefore: targetAtSubmit?.accumulatedAmount || 0,
              targetAfter: (targetAtSubmit?.accumulatedAmount || 0) - editTransfer!.amount + pd.data.amount,
              amount: pd.data.amount,
            });
            reset();
            setCurrentStep(0);
          },
        },
      );
    } else {
      const pd = goalOverflow.pendingData as TransferDto;
      setGoalOverflow(null);
      const targetAtSubmit = pockets?.find((p) => p.id === pd.targetPocketId);
      transfer({ ...pd, newGoal }, {
        onSuccess: () => {
          setTransferResult({
            sourceName: sourcePocket?.name || '',
            sourceBefore: sourcePocket?.accumulatedAmount || 0,
            sourceAfter: (sourcePocket?.accumulatedAmount || 0) - pd.amount,
            targetName: targetAtSubmit?.name || '',
            targetBefore: targetAtSubmit?.accumulatedAmount || 0,
            targetAfter: (targetAtSubmit?.accumulatedAmount || 0) + pd.amount,
            amount: pd.amount,
          });
          reset();
          setCurrentStep(0);
        },
      });
    }
  };

  const handleDismissGoalOverflow = () => {
    setGoalOverflow(null);
  };

  // ═══════════════════════════════════════════
  // SUCCESS VIEW
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
          {animPhase >= 1 && (
            <div className="flex justify-center pt-4 animate-[badge-enter_0.4s_ease-out]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30
                border border-green-200 dark:border-green-800/40 shadow-sm animate-[badge-glow_2s_ease-in-out_infinite]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {isEditMode ? 'Actualizado' : 'Transferido'}
              </span>
            </div>
          )}

          <div className={`flex items-center justify-center gap-4 select-none ${animPhase >= 1 ? 'pt-2' : 'pt-8'}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32">
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

            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0 shadow-md drop-shadow-[0_0_8px_rgba(147,51,234,0.35)]">
              <ArrowsRightLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32">
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

          <div
            className={cn(
              'grid grid-cols-2 gap-3 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              animPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
            )}
          >
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
  // EDIT MODE — single form, no steps
  // ═══════════════════════════════════════════
  if (isEditMode) {
    return (
      <>
        <Modal isOpen={isOpen} onClose={handleClose} title="Editar transferencia" glass glassBackdrop>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            {/* De ↔️ Para Header (both read-only) */}
            <div className="flex items-center gap-3 pt-2 pb-1 select-none">
              <div className="flex-1 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-0.5">
                  De
                </div>
                <div className="text-sm font-bold text-secondary-900 dark:text-white">
                  {sourcePocket?.name || '—'}
                </div>
                <div className="text-[11px] text-secondary-500 dark:text-secondary-400">
                  {sourcePocket ? formatCurrency(sourcePocket.accumulatedAmount) : ''}
                </div>
              </div>

              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
                <ArrowsRightLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>

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
                    {editTransfer?.targetPocketId ? 'Cargando...' : 'Seleccionar destino'}
                  </div>
                )}
              </div>
            </div>

            {/* Amount + Reason */}
            <div className="space-y-4">
              <FloatCurrency
                label="Monto"
                accent="pocket"
                glass
                currency="COP"
                value={watchedAmount}
                onChange={(val) => setValue('amount', val, { shouldValidate: true })}
                error={errors.amount?.message}
                helperText={`Disponible: ${formatCurrency(maxAmount)}`}
                fullWidth
                emitOnChange
              />
              <FloatInput
                label="Motivo"
                accent="pocket"
                glass
                error={errors.reason?.message}
                value={watchedReason}
                fullWidth
                helperText="Editá el motivo de la transferencia"
                maxLength={50}
                minLength={10}
                {...register('reason')}
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || watchedAmount <= 0 || !watchedReason?.trim()}
                className="px-4 py-1.5 rounded-full text-sm font-semibold
                  bg-gradient-to-r from-purple-500/10 to-indigo-500/10
                  dark:from-purple-500/20 dark:to-indigo-500/20
                  border border-purple-300/30 dark:border-purple-400/30
                  text-purple-600 dark:text-purple-300
                  hover:from-purple-500/20 hover:to-indigo-500/20
                  hover:border-purple-300/60 dark:hover:border-purple-400/60
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-300"
              >
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Goal overflow dialog */}
        {goalOverflow && (
          <Modal
            isOpen={!!goalOverflow}
            onClose={handleDismissGoalOverflow}
            title="Meta de ahorro superada"
            description={`La transferencia supera la meta actual de "${goalOverflow.targetPocket.name}".`}
            size="sm"
            glass
            glassBackdrop
          >
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Meta actual</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {formatCurrency(goalOverflow.targetPocket.goal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Nuevo acumulado</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {formatCurrency(goalOverflow.wouldBeAccumulated)}
                  </span>
                </div>
                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 flex justify-between font-semibold">
                  <span className="text-secondary-900 dark:text-white">Nueva meta sugerida</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatCurrency(
                      Math.max(
                        goalOverflow.targetPocket.goal,
                        Math.ceil(goalOverflow.wouldBeAccumulated),
                      ),
                    )}
                  </span>
                </div>
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
                ¿Querés extender la meta para reflejar el nuevo acumulado?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDismissGoalOverflow}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExtendGoal}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-full text-sm font-semibold
                    bg-gradient-to-r from-emerald-500/10 to-green-500/10
                    dark:from-emerald-500/20 dark:to-green-500/20
                    border border-emerald-300/30 dark:border-emerald-400/30
                    text-emerald-600 dark:text-emerald-300
                    hover:from-emerald-500/20 hover:to-green-500/20
                    hover:border-emerald-300/60 dark:hover:border-emerald-400/60
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-300"
                >
                  Extender meta
                </button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════
  // CREATE MODE (existing behavior)
  // ═══════════════════════════════════════════
  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Transferir a otro bolsillo" glass glassBackdrop>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* ═══ Step indicator ═══ */}
          <FormStepIndicator
            currentStep={currentStep}
            totalSteps={STEPS_CREATE.length}
            currentLabel={STEPS_CREATE[currentStep].label}
            barColor="bg-purple-500"
          />

          {/* ═══ De ↔️ Para Header ═══ */}
          <div className="flex items-center gap-3 pt-2 pb-1 select-none">
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

            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
              <ArrowsRightLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>

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

          {/* ═══ Step content ═══ */}
          <div className="space-y-4">
            {currentStep === 0 && (
              <FloatSelect
                label="Bolsillo Destino"
                accent="pocket"
                glass
                options={targetOptions}
                error={errors.targetPocketId?.message}
                value={watchedTargetId}
                helperText={
                  targetPocket
                    ? `Saldo actual del destino: ${formatCurrency(targetPocket.accumulatedAmount)}`
                    : 'Elige el bolsillo que recibe el dinero'
                }
                {...register('targetPocketId')}
              />
            )}

            {currentStep === 1 && (
              <>
              <FloatCurrency
                label="Monto"
                accent="pocket"
                glass
                currency="COP"
                value={watchedAmount}
                onChange={(val) => setValue('amount', val, { shouldValidate: true })}
                error={errors.amount?.message}
                helperText={`Disponible para transferir: ${formatCurrency(maxAmount)}`}
                fullWidth
                emitOnChange
              />
              <FloatInput
                label="Motivo"
                accent="pocket"
                glass
                error={errors.reason?.message}
                value={watchedReason}
                fullWidth
                helperText="Escribe el motivo por el cual transfieres"
                maxLength={50}
                minLength={10}
                {...register('reason')}
              />
              </>
            )}
          </div>

          {/* ═══ Step actions ═══ */}
          <StepActions
            currentStep={currentStep}
            totalSteps={STEPS_CREATE.length}
            onBack={handleGoBack}
            onContinue={handleContinue}
            canContinue={
              currentStep === 0
                ? !!watchedTargetId
                : currentStep === 1
                  ? watchedAmount > 0 && watchedReason.length >= 10
                  : true
            }
            disabled={isPending}
            checkClassName="text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            submitLabel="Transferir"
          />
        </form>
      </Modal>

      {/* Goal overflow dialog */}
      {goalOverflow && (
        <Modal
          isOpen={!!goalOverflow}
          onClose={handleDismissGoalOverflow}
          title="Meta de ahorro superada"
          description={`La transferencia supera la meta actual de "${goalOverflow.targetPocket.name}".`}
          size="sm"
          glass
          glassBackdrop
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500 dark:text-secondary-400">Meta actual</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {formatCurrency(goalOverflow.targetPocket.goal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500 dark:text-secondary-400">Nuevo acumulado</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {formatCurrency(goalOverflow.wouldBeAccumulated)}
                </span>
              </div>
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 flex justify-between font-semibold">
                <span className="text-secondary-900 dark:text-white">Nueva meta sugerida</span>
                <span className="text-purple-600 dark:text-purple-400">
                  {formatCurrency(
                    Math.max(
                      goalOverflow.targetPocket.goal,
                      Math.ceil(goalOverflow.wouldBeAccumulated),
                    ),
                  )}
                </span>
              </div>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
              ¿Querés extender la meta para reflejar el nuevo acumulado?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDismissGoalOverflow}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExtendGoal}
                disabled={isPending}
                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold
                  bg-gradient-to-r from-emerald-500/10 to-green-500/10
                  dark:from-emerald-500/20 dark:to-green-500/20
                  border border-emerald-300/30 dark:border-emerald-400/30
                  text-emerald-600 dark:text-emerald-300
                  hover:from-emerald-500/20 hover:to-green-500/20
                  hover:border-emerald-300/60 dark:hover:border-emerald-400/60
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-300"
              >
                Extender meta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default TransferModal;
