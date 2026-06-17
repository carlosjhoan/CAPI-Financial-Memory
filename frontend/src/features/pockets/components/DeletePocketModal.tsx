import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pocket, DistributionItem } from '../types/pocket.types';
import { formatCurrency } from '../../../core/utils/format';
import { usePockets, useDeletePocket, useDeleteWithTransfer } from '../hooks/usePockets';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Select from '../../../shared/components/Select';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import Input from '../../../shared/components/Input';

type DeletePhase =
  | { stage: 'idle' }
  | { stage: 'phase-0'; pocket: Pocket }
  | { stage: 'phase-1'; pocket: Pocket }
  | { stage: 'phase-2'; pocket: Pocket; distributions: DistributionItem[] }
  | { stage: 'phase-3'; pocket: Pocket }
  | { stage: 'phase-4'; pocket: Pocket; distributions: DistributionItem[]; reason: string };

export interface DeletePocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocket: Pocket | null;
  onConfirm?: () => Promise<void>;
  isLoading?: boolean;
}

const DeletePocketModal: React.FC<DeletePocketModalProps> = ({
  isOpen,
  onClose,
  pocket,
  onConfirm: _onConfirm,
  isLoading: _isLoading,
}) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<DeletePhase>({ stage: 'idle' });
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [reason, setReason] = useState('');
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

  // Reset to idle when modal opens/closes
  useEffect(() => {
    if (isOpen && pocket) {
      if (pocket.accumulatedAmount === 0) {
        setPhase({ stage: 'phase-0', pocket });
      } else {
        setPhase({ stage: 'phase-1', pocket });
      }
      setDistributions([]);
      setReason('');
      setGoalOverflowError(null);
      setExtendedGoalMap({});
    } else if (!isOpen) {
      setPhase({ stage: 'idle' });
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

  const handleTransferAll = () => {
    if (!pocket) return;
    const firstTarget = compatiblePockets[0];
    const dist: DistributionItem[] = firstTarget
      ? [{ targetPocketId: firstTarget.id, amount: pocket.accumulatedAmount }]
      : [];
    setDistributions(dist);
    setPhase({ stage: 'phase-2', pocket, distributions: dist });
  };

  const handleSplitMode = () => {
    if (!pocket) return;
    setDistributions([]);
    setPhase({ stage: 'phase-3', pocket });
  };

  const handleSingleDistChange = (targetPocketId: string, amount: number) => {
    if (!pocket) return;
    const dist: DistributionItem[] = [{ targetPocketId, amount }];
    setDistributions(dist);
    setPhase({ stage: 'phase-2', pocket, distributions: dist });
  };

  const handleProceedToConfirm = () => {
    if (!pocket) return;
    setPhase({ stage: 'phase-4', pocket, distributions, reason });
  };

  const handleBackToWarn = () => {
    if (!pocket) return;
    setPhase({ stage: 'phase-1', pocket });
  };

  const handleBackToSingle = () => {
    if (!pocket) return;
    setPhase({ stage: 'phase-2', pocket, distributions });
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

  // ── Render phases ──

  if (!pocket) return null;

  // Phase 0: accumulatedAmount === 0 — existing delete confirmation
  if (phase.stage === 'phase-0') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Bolsillo" description="¿Estás seguro de eliminar este bolsillo?" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Esta acción no se puede deshacer</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>El bolsillo será eliminado permanentemente del sistema junto con todos sus datos.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Nombre:</span>
              <span className="text-base font-semibold text-secondary-900 dark:text-white">{pocket.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Valor Acumulado:</span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(pocket.accumulatedAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Meta:</span>
              <span className="text-sm text-secondary-900 dark:text-white">{formatCurrency(pocket.goal)}</span>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={handlePhase0Delete} isLoading={isDeleting} disabled={isLoading}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Phase 1: accumulatedAmount > 0 — warning + option buttons
  if (phase.stage === 'phase-1') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Transferir antes de eliminar" size="md">
        <div className="space-y-4">
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
          <div className="space-y-3">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">¿Cómo deseas distribuir los fondos?</p>
            <Button type="button" variant="primary" className="w-full" onClick={handleTransferAll} disabled={compatiblePockets.length === 0}>
              Transferir todo a un bolsillo
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleSplitMode}>
              Dividir entre varios bolsillos
            </Button>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Phase 2: Single transfer form
  if (phase.stage === 'phase-2') {
    const currentDist = distributions[0] || { targetPocketId: '', amount: 0 };
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Transferir fondos" size="md">
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Transferirás <strong>{formatCurrency(pocket.accumulatedAmount)}</strong> a un solo bolsillo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Bolsillo destino</label>
            <Select
              value={currentDist.targetPocketId}
              onChange={(e) => handleSingleDistChange(e.target.value, pocket.accumulatedAmount)}
              options={compatiblePockets.map((p) => ({
                label: `${p.name} (${formatCurrency(p.accumulatedAmount)})`,
                value: p.id,
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Monto</label>
            <CurrencyInput
              value={currentDist.amount}
              onChange={(val) => handleSingleDistChange(currentDist.targetPocketId, val)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Motivo</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Razón de la transferencia" />
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

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBackToWarn}>Volver</Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleProceedToConfirm}
              disabled={!currentDist.targetPocketId || currentDist.amount <= 0}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Phase 3: Split mode
  if (phase.stage === 'phase-3') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Dividir fondos" size="lg">
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Motivo (opcional)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Razón de las transferencias" />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBackToWarn}>Volver</Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleProceedToConfirm}
              disabled={!isSumValid || distributions.length === 0}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Phase 4: Confirm summary
  if (phase.stage === 'phase-4') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Resumen de la operación</h3>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              Se eliminará <strong>{pocket.name}</strong> y se transferirán <strong>{formatCurrency(pocket.accumulatedAmount)}</strong> a:
            </p>
            <ul className="space-y-1">
              {distributions.map((dist, i) => {
                const targetPocket = compatiblePockets.find((p) => p.id === dist.targetPocketId);
                return (
                  <li key={i} className="flex justify-between text-sm bg-secondary-50 dark:bg-secondary-800 p-2 rounded">
                    <span>{targetPocket?.name || dist.targetPocketId}</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(dist.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {reason && (
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              <span className="font-medium">Motivo:</span> {reason}
            </div>
          )}

          {goalOverflowError && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">{goalOverflowError}</p>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="primary" size="sm" onClick={handleAcceptGoalExtension}>Aceptar y continuar</Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDismissGoalError}>Cancelar</Button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBackToSingle} disabled={isLoading}>Volver</Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteWithTransfer}
              isLoading={isTransferPending}
              disabled={isLoading}
            >
              Confirmar y eliminar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
};

export default DeletePocketModal;
