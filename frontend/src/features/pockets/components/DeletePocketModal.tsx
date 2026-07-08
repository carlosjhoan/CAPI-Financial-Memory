import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { Pocket, DistributionItem } from '../types/pocket.types';
import { formatCurrency } from '../../../core/utils/format';
import { usePockets, useDeletePocket, useDeleteWithTransfer } from '../hooks/usePockets';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Select from '../../../shared/components/Select';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import FormStepIndicator from '../../../shared/components/forms/FormStepIndicator';
import StepActions from '../../../shared/components/forms/StepActions';


type DeletePhase =
  | { stage: 'idle' }
  | { stage: 'phase-0'; pocket: Pocket }
  | { stage: 'phase-1'; pocket: Pocket }
  | { stage: 'phase-2'; pocket: Pocket; distributions: DistributionItem[] }
  | { stage: 'phase-3'; pocket: Pocket }
  | { stage: 'phase-4'; pocket: Pocket; distributions: DistributionItem[] };

export interface DeletePocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocket: Pocket | null;
  onConfirm?: () => Promise<void>;
  isLoading?: boolean;
}

const DELETE_STEPS = [
  { label: 'Método' },
  { label: 'Distribución' },
  { label: 'Confirmar' },
];

const DeletePocketModal: React.FC<DeletePocketModalProps> = ({
  isOpen,
  onClose,
  pocket,
  onConfirm: _onConfirm,
  isLoading: _isLoading,
}) => {
  const navigate = useNavigate();
  const setPhase = useState<DeletePhase>({ stage: 'idle' })[1];
  const [currentStep, setCurrentStep] = useState(0);
  const [method, setMethod] = useState<'transferir' | 'dividir' | null>(null);
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const reason = useMemo(() => pocket ? `Herencia de bolsillo ${pocket.name}` : '', [pocket]);
  const [goalOverflowError, setGoalOverflowError] = useState<string | null>(null);
  const [extendedGoalMap, setExtendedGoalMap] = useState<Record<string, number>>({});
  const { mutate: deleteWithTransfer, isPending: isTransferPending } = useDeleteWithTransfer();
  const { mutate: deletePocket, isPending: isDeleting } = useDeletePocket();
  const { data: pocketsList } = usePockets();

  // Filters for compatible targets (exclude source pocket)
  const compatiblePockets = useMemo(() => {
    if (!pocketsList || !pocket) return [];
    return pocketsList.filter((p) => p.id !== pocket.id);
  }, [pocketsList, pocket]);

  const isLoading = isDeleting || isTransferPending;
  const isSimplified = pocket && pocket.accumulatedAmount === 0;
  const steps = isSimplified ? [{ label: 'Confirmar' }] : DELETE_STEPS;

  // Reset to idle when modal opens/closes
  useEffect(() => {
    if (isOpen && pocket) {
      setCurrentStep(0);
      setMethod(null);
      if (pocket.accumulatedAmount === 0) {
        setPhase({ stage: 'phase-0', pocket });
      } else {
        setPhase({ stage: 'phase-1', pocket });
      }
      setDistributions([]);
      setGoalOverflowError(null);
      setExtendedGoalMap({});
    } else if (!isOpen) {
      setPhase({ stage: 'idle' });
      setCurrentStep(0);
      setMethod(null);
    }
  }, [isOpen, pocket]);

  // ── Handlers ──

  const handlePhase0Delete = () => {
    if (!pocket) return;
    deletePocket(pocket.id, {
      onSuccess: () => {
        navigate('/pockets');
        onClose();
      },
    });
  };

  const handleMethodSelect = (selectedMethod: 'transferir' | 'dividir') => {
    if (!pocket) return;
    setMethod(selectedMethod);
    if (selectedMethod === 'transferir') {
      const firstTarget = compatiblePockets[0];
      const dist: DistributionItem[] = firstTarget
        ? [{ targetPocketId: firstTarget.id, amount: pocket.accumulatedAmount }]
        : [];
      setDistributions(dist);
      setPhase({ stage: 'phase-2', pocket, distributions: dist });
    } else {
      setDistributions([]);
      setPhase({ stage: 'phase-3', pocket });
    }
  };

  const handleSingleDistChange = (targetPocketId: string, amount: number) => {
    if (!pocket) return;
    const dist: DistributionItem[] = [{ targetPocketId, amount }];
    setDistributions(dist);
    setPhase({ stage: 'phase-2', pocket, distributions: dist });
  };

  const handleProceedToConfirm = () => {
    if (!pocket) return;
    setPhase({ stage: 'phase-4', pocket, distributions });
    setCurrentStep(2);
  };

  const handleGoBack = () => {
    if (currentStep === 0) return;
    setCurrentStep((s) => s - 1);
  };

  const handleConfirmDeleteWithTransfer = () => {
    if (!pocket) return;

    const enrichedDistributions = distributions.map((d) => ({
      ...d,
      ...(extendedGoalMap[d.targetPocketId]
        ? { newGoal: extendedGoalMap[d.targetPocketId] }
        : {}),
    }));

    deleteWithTransfer(
      { pocketId: pocket.id, distributions: enrichedDistributions, reason },
      {
        onSuccess: () => {
          navigate('/pockets');
          onClose();
        },
        onError: (err: Error) => {
          if (err.message?.startsWith('TRANSFER_EXCEEDS_GOAL')) {
            const parts = err.message.split(':');
            const remaining = parseFloat(parts[1]);
            const amount = parseFloat(parts[2]);
            const targetId = parts[3];
            const targetPocket = compatiblePockets.find((p) => p.id === targetId);
            if (targetPocket && targetPocket.type === 'goal') {
              const suggested = targetPocket.accumulatedAmount + amount;
              setGoalOverflowError(
                `La meta de "${targetPocket.name}" tiene $${remaining.toFixed(2)} restantes. ` +
                `Sugerencia: extender meta a $${suggested.toFixed(2)}.`,
              );
              setExtendedGoalMap((prev) => ({
                ...prev,
                [targetId]: suggested,
              }));
            }
          }
        },
      },
    );
  };

  const handleAcceptGoalExtension = () => {
    setGoalOverflowError(null);
    handleConfirmDeleteWithTransfer();
  };

  const handleDismissGoalError = () => {
    setGoalOverflowError(null);
  };

  // ── Running sum for split mode ──
  const totalDistributed = useMemo(() => {
    return distributions.reduce((s, d) => s + d.amount, 0);
  }, [distributions]);

  const remainingDist = useMemo(() => {
    if (!pocket) return 0;
    return pocket.accumulatedAmount - totalDistributed;
  }, [pocket, totalDistributed]);

  const isSumValid = useMemo(() => {
    if (!pocket) return false;
    return Math.abs(totalDistributed - pocket.accumulatedAmount) < 0.001;
  }, [pocket, totalDistributed]);

  // ── Split row handlers ──
  const addSplitRow = () => {
    if (distributions.length >= 10) return;
    const nextTarget = compatiblePockets.find(
      (p) => !distributions.some((d) => d.targetPocketId === p.id),
    );
    setDistributions((prev) => [
      ...prev,
      {
        targetPocketId: nextTarget?.id || '',
        amount: 0,
      },
    ]);
  };

  const updateSplitRow = (index: number, field: 'targetPocketId' | 'amount', value: string | number) => {
    setDistributions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeSplitRow = (index: number) => {
    setDistributions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (currentStep === 0) {
      if (!method) return;
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1) {
      if (method === 'transferir') {
        const currentDist = distributions[0];
        if (!currentDist?.targetPocketId || currentDist.amount <= 0) return;
      } else if (method === 'dividir') {
        if (!isSumValid || distributions.length === 0) return;
      }
      handleProceedToConfirm();
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const canContinue = useMemo(() => {
    if (currentStep === 0) return !!method;
    if (currentStep === 1) {
      if (method === 'transferir') {
        const d = distributions[0];
        return !!d?.targetPocketId && d.amount > 0;
      }
      if (method === 'dividir') {
        return isSumValid && distributions.length > 0;
      }
      return false;
    }
    return true;
  }, [currentStep, method, distributions, isSumValid]);

  if (!pocket) return null;

  // ═══════════════════════════════════════════
  // SIMPLIFIED VIEW (accumulatedAmount === 0)
  // ═══════════════════════════════════════════
  if (isSimplified) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={"Eliminar bolsillo: " + pocket.name} showCloseButton={false}>
        <form
          onSubmit={(e) => { e.preventDefault(); handlePhase0Delete(); }}
        >
          <FormStepIndicator
            currentStep={0}
            totalSteps={1}
            currentLabel="Confirmar"
            barColor="bg-purple-500"
          />
          <div className="space-y-4">
            {/* Info badge */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Se eliminará <strong>{pocket.name}</strong>
                  </p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    Este bolsillo no tiene fondos acumulados.
                  </p>
                  {pocket.type === 'goal' && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Meta: {formatCurrency(pocket.goal)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning text */}
            <div className="text-center">
              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                ¿Estás seguro de eliminar este bolsillo?
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                Esta acción no se puede deshacer
              </p>
            </div>

            {/* Decision buttons */}
            <div className="flex items-center justify-center gap-5 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full border border-secondary-300 dark:border-secondary-600 px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                No, mejor no
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sí, muy seguro
              </button>
            </div>
          </div>
        </form>
      </Modal>
    );
  }

  // ═══════════════════════════════════════════
  // MULTI-STEP VIEW (accumulatedAmount > 0)
  // ═══════════════════════════════════════════
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"Eliminar bolsillo: " + pocket.name} showCloseButton={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === steps.length - 1) {
            handleConfirmDeleteWithTransfer();
          }
        }}
      >
        <FormStepIndicator
          currentStep={currentStep}
          totalSteps={steps.length}
          currentLabel={steps[currentStep].label}
          barColor="bg-purple-500"
        />

        <div className="space-y-4">
          {/* ═══ Step 0: Method selector ═══ */}
          {currentStep === 0 && (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Fondos disponibles</h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      <p>Este bolsillo tiene <strong>{formatCurrency(pocket.accumulatedAmount)}</strong> en fondos. Debes transferirlos antes de eliminar.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-secondary-600 dark:text-secondary-400">¿Cómo deseas distribuir los fondos?</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Todo a un bolsillo card */}
                <button
                  type="button"
                  onClick={() => handleMethodSelect('transferir')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    method === 'transferir'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                  }`}
                >
                  <PaperAirplaneIcon className="h-6 w-6" />
                  <span className="text-sm font-medium">Todo a un bolsillo</span>
                  <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                    Se transfiere todo a un solo bolsillo
                  </span>
                </button>

                {/* Entre varios bolsillos card */}
                <button
                  type="button"
                  onClick={() => handleMethodSelect('dividir')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    method === 'dividir'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3l3 3-3 3M12 15l3 3-3 3" />
                  </svg>
                  <span className="text-sm font-medium">Entre varios bolsillos</span>
                  <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                    Se divide el valor entre varios bolsillos
                  </span>
                </button>
              </div>
            </>
          )}

          {/* ═══ Step 1: Distribution — single transfer ═══ */}
          {currentStep === 1 && method === 'transferir' && (
            <>
              {(() => {
                const currentDist = distributions[0] || { targetPocketId: '', amount: 0 };
                return (
                  <>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Transferirás <strong>{formatCurrency(pocket.accumulatedAmount)}</strong> a un solo bolsillo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Bolsillo destino</label>
                      <Select
                        accent="pocket"
                        value={currentDist.targetPocketId}
                        onChange={(e) => handleSingleDistChange(e.target.value, pocket.accumulatedAmount)}
                        options={compatiblePockets.map((p) => ({
                          label: `${p.name} (${formatCurrency(p.accumulatedAmount)})`,
                          value: p.id,
                        }))}
                      />
                    </div>

                    {goalOverflowError && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">{goalOverflowError}</p>
                        <div className="flex gap-2 mt-2">
                          <Button type="button" variant="primary" size="sm" onClick={handleAcceptGoalExtension}>Aceptar y continuar</Button>
                          <Button type="button" variant="outline" size="sm" onClick={handleDismissGoalError}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {/* ═══ Step 1: Distribution — split mode ═══ */}
          {currentStep === 1 && method === 'dividir' && (
            <>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Distribuye los <strong>{formatCurrency(pocket.accumulatedAmount)}</strong> entre uno o más bolsillos.
                </p>
              </div>

              {/* Running sum */}
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Total distribuido: <span className={isSumValid ? 'text-green-600' : 'text-amber-600'}>{formatCurrency(totalDistributed)}</span>
                </span>
                <span className="text-sm text-secondary-500">
                  Restante: {formatCurrency(remainingDist)}
                </span>
              </div>

              {/* Distribution rows */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {distributions.map((dist, index) => (
                  <div key={index} className="flex items-end gap-2 p-2 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Destino</label>
                      <Select
                        accent="pocket"
                        value={dist.targetPocketId}
                        onChange={(e) => updateSplitRow(index, 'targetPocketId', e.target.value)}
                        options={compatiblePockets.map((p) => ({
                          label: p.name,
                          value: p.id,
                        }))}
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Monto</label>
                      <CurrencyInput
                        accent="pocket"
                        value={dist.amount}
                        onChange={(val) => updateSplitRow(index, 'amount', val)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplitRow(index)}
                      disabled={distributions.length <= 1}
                      className="mb-0.5"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add row button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSplitRow}
                disabled={distributions.length >= 10}
                className="w-full"
              >
                + Agregar bolsillo ({distributions.length}/10)
              </Button>

              {/* Goal overflow */}
              {goalOverflowError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">{goalOverflowError}</p>
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="primary" size="sm" onClick={handleAcceptGoalExtension}>Aceptar y continuar</Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDismissGoalError}>Cancelar</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ Step 2: Confirmar eliminación ═══ */}
          {currentStep === 2 && (
            <>
              {/* Info badge — qué va a pasar */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 mt-0.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">
                      Se eliminará <strong>{pocket.name}</strong>
                    </p>
                    <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-300">
                      Sus fondos se transferirán a:
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-purple-200 dark:divide-purple-800">
                  {distributions.map((dist, i) => {
                    const targetPocket = compatiblePockets.find((p) => p.id === dist.targetPocketId);
                    return (
                      <div key={i} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                        <span className="text-sm font-bold text-secondary-900 dark:text-white">
                          {targetPocket?.name || dist.targetPocketId}
                        </span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(dist.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning text */}
              <div className="text-center">
                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  ¿Estás seguro de eliminar este bolsillo?
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  Esta acción no se puede deshacer
                </p>
              </div>

              {goalOverflowError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">{goalOverflowError}</p>
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="primary" size="sm" onClick={handleAcceptGoalExtension}>Aceptar y continuar</Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDismissGoalError}>Cancelar</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ Step actions: custom for step 2, StepActions for 0-1 ═══ */}
        {currentStep === 2 ? (
          <div className="flex items-center justify-center gap-5 pt-6">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleGoBack}
                disabled={isLoading}
                className="flex h-11 w-11 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
                aria-label="Atrás"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full border border-secondary-300 dark:border-secondary-600 px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              No, mejor no
            </button>

            <button
              type="button"
              onClick={handleConfirmDeleteWithTransfer}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Sí, muy seguro
            </button>
          </div>
        ) : (
          <StepActions
            currentStep={currentStep}
            totalSteps={steps.length}
            onBack={handleGoBack}
            onContinue={handleContinue}
            canContinue={canContinue}
            disabled={isLoading}
            checkClassName="text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            submitLabel="Confirmar y eliminar"
          />
        )}
      </form>
    </Modal>
  );
};

export default DeletePocketModal;
