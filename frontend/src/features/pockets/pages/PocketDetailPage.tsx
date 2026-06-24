import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowsRightLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePockets, usePocket, useUpdatePocket, useDeletePocket, usePocketHistory } from '../hooks/usePockets';
import type { PocketFormData } from '../hooks/usePocketForm';
import { formatCurrency } from '../../../core/utils/format';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import DeletePocketModal from '../components/DeletePocketModal';
import TransferModal from '../components/TransferModal';
import PocketForm from '../components/PocketForm';
import { getPocketMood } from '../helpers/pocketMood';
import type { Pocket } from '../types/pocket.types';
import HistoryProgressArc from '../components/HistoryProgressArc';
import HistorySparkline from '../components/HistorySparkline';

/** Trackea qué pockets ya vieron su animación this session */
const animatedPockets = new Set<string>();

/** True si la fecha cae en el día de hoy */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

/** Formatea fecha como "DD MMM YYYY" (ej: "15 May 2026") — hoy muestra "HOY" */
function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'HOY';
  const day = d.getDate().toString().padStart(2, '0');
  const month = d
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Extrae HH:MM de un ISO timestamp o string de fecha */
function formatTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const PocketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pocket, isLoading, error } = usePocket(id || '');
  const { data: pocketsList } = usePockets();
  const historyQuery = usePocketHistory(id || '');
  const updatePocketMutation = useUpdatePocket();
  const deletePocketMutation = useDeletePocket();

  // Mapa de id → nombre para resolver nombres de pockets en transferencias
  const pocketNameMap = useMemo(() => {
    if (!pocketsList) return new Map<string, string>();
    return new Map(pocketsList.map((p: Pocket) => [p.id, p.name]));
  }, [pocketsList]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  // Primer visita en la sesión: animación + KPIs ocultos; repetidas: sin animación + KPIs visibles
  const isFirstView = !animatedPockets.has(pocket?.id || '');
  const [animate] = useState(() => isFirstView);
  const [showKPIs, setShowKPIs] = useState(() => !isFirstView);

  // ── Cálculos derivados (ANTES de early returns) ──
  const isGoal = pocket?.type === 'goal';
  const incomes = pocket?.incomes || [];
  const expenses = pocket?.expenses || [];

  const transfers = pocket?.transfers || [];
  const incomingTransfers = transfers.filter(t => t.direction === 'incoming');
  const outgoingTransfers = transfers.filter(t => t.direction === 'outgoing');

  const totalDeposited =
    (pocket?.initialAmount || 0)
    + incomes.reduce((sum, inc) => sum + inc.amount, 0)
    + incomingTransfers.reduce((sum, t) => sum + t.amount, 0);

  const totalSpent =
    expenses.reduce((sum, exp) => sum + exp.amount, 0)
    + outgoingTransfers.reduce((sum, t) => sum + t.amount, 0);

  const netAmount = pocket?.accumulatedAmount || 0;

  const efficiency = useMemo(() => {
    return totalDeposited > 0
      ? ((totalDeposited - totalSpent) / totalDeposited) * 100
      : 0;
  }, [totalDeposited, totalSpent]);

  const monthlyAverage = useMemo(() => {
    if (incomes.length === 0) return 0;
    const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    // Encontrar el primer ingreso por fecha
    const firstInc = incomes.reduce((earliest, inc) =>
      new Date(inc.date) < new Date(earliest.date) ? inc : earliest,
    incomes[0]);
    const monthsSinceFirst = Math.max(
      1,
      (Date.now() - new Date(firstInc.date).getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    return total / monthsSinceFirst;
  }, [incomes]);

  const activeSince = useMemo(() => {
    if (!pocket) return '';
    return new Date(pocket.createdAt)
      .toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pocket?.createdAt]);

  // ── HistoryItem type plano (evita uniones complejas) ──
  interface HistoryItem {
    id: string;
    type: 'deposit' | 'expense' | 'transfer' | 'opening' | 'income';
    amount: number;
    date: string;
    createdAt?: string;
    reason?: string;
    direction?: 'incoming' | 'outgoing';
    description?: string;
    sourcePocketId?: string;
    targetPocketId?: string;
  }

  // ── Historial paginado (desde backend) ──
  const history: HistoryItem[] = useMemo(() => {
    if (!historyQuery.data) return [];

    const pages = historyQuery.data.pages.flatMap(p => p.data);

    const mapped: HistoryItem[] = pages.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      type: item.type as 'deposit' | 'expense' | 'transfer' | 'income',
      amount: Number(item.amount),
      date: item.date as string,
      createdAt: item.createdAt as string | undefined,
      reason: (item.reason as string) || undefined,
      direction: (item.direction as 'incoming' | 'outgoing') || undefined,
      sourcePocketId: (item.sourcePocketId as string) || undefined,
      targetPocketId: (item.targetPocketId as string) || undefined,
    }));

    // Agregar movimiento de apertura al final (es el más antiguo)
    if (pocket?.initialMovement) {
      mapped.push({
        id: 'opening',
        type: 'opening',
        amount: pocket.initialMovement.amount,
        date: pocket.initialMovement.date,
        description: pocket.initialMovement.description,
      });
    }

    return mapped;
  }, [historyQuery.data, pocket?.initialMovement]);

  // ── Agrupar historial por fecha ──
  const groupedHistory = useMemo(() => {
    const groups = new Map<string, HistoryItem[]>();
    for (const item of history) {
      const key = item.date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
    );
  }, [history]);

  const getMovementLabel = (item: HistoryItem): string => {
    switch (item.type) {
      case 'deposit': return 'Depósito';
      case 'income': return 'Ingreso';
      case 'expense': return 'Gasto';
      case 'transfer': return 'Transferencia';
      case 'opening': return 'Apertura';
      default: return 'Movimiento';
    }
  };

  const getMovementIcon = (item: HistoryItem): string => {
    if (item.type === 'transfer') {
      return item.direction === 'incoming' ? '↑' : '↓';
    }
    if (item.type === 'opening') return '★';
    if (item.type === 'deposit' || item.type === 'income') return '↑';
    return '↓';
  };
  
  const getDefaultReason = (item: HistoryItem): string => {
    if (item.reason) return item.reason;
    switch (item.type) {
      case 'deposit': return 'Por motivo de ingreso';
      case 'income': return 'Por motivo de ingreso';
      case 'expense': return 'Por motivo de gasto';
      case 'transfer':
        return item.direction === 'incoming'
          ? 'Transferencia recibida'
          : 'Transferencia enviada';
      case 'opening': return 'Monto de apertura del bolsillo';
      default: return '—';
    }
  };

  const getMovementColor = (item: HistoryItem): string => {
    if (item.type === 'transfer') {
      return item.direction === 'incoming' ? 'text-green-500' : 'text-red-500';
    }
    if (item.type === 'opening') return 'text-blue-500';
    if (item.type === 'deposit' || item.type === 'income') return 'text-green-500';
    return 'text-red-500';
  };

  const getMovementSign = (item: HistoryItem): string => {
    if (item.type === 'transfer') {
      return item.direction === 'incoming' ? '+' : '-';
    }
    if (item.type === 'opening') return '+';
    if (item.type === 'deposit' || item.type === 'income') return '+';
    return '-';
  };

  const pocketMood = useMemo(() => {
    if (!pocket) return { image: '', status: '', message: '', glowColor: '', glowColorDark: '' };
    return getPocketMood(pocket);
  }, [pocket]);

  const handleUpdate = async (data: PocketFormData) => {
    if (!pocket) return;
    await updatePocketMutation.mutateAsync({ id: pocket.id, data });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deletePocketMutation.mutateAsync(id);
    navigate('/pockets');
  };

  const handleBack = () => {
    navigate('/pockets');
  };

  // ── Early returns ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Cargando bolsillo...
          </p>
        </div>
      </div>
    );
  }

  if (error || !pocket) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          {error ? 'Error al cargar bolsillo' : 'Bolsillo no encontrado'}
        </h3>
        <Button onClick={handleBack}>
          Volver a Bolsillos
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Pulso de color para el mantra */
        @keyframes mantra-pulse {
          0%, 100% { color: #64748B; } /* Gray-500 */
          50% { color: #1E293B; }      /* Slate-800 */
        }
        @keyframes mantra-pulse-dark {
          0%, 100% { color: #94A3B8; } /* Slate-400 */
          50% { color: #FFFFFF; }      /* White */
        }
        .mantra-pulse-unified {
          animation: mantra-pulse 8s infinite ease-in-out;
        }
        .dark .mantra-pulse-unified {
          animation: mantra-pulse-dark 8s infinite ease-in-out;
        }

        /* Halo pulsante para KPIs */
        @keyframes pulse-shadow {
          0%, 100% { filter: drop-shadow(0 0 2px currentColor); }
          50% { filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor); }
        }
        .pulse-fast { animation: pulse-shadow 2s infinite ease-in-out; }
        .pulse-slow { animation: pulse-shadow 4s infinite ease-in-out; }

        /* Milestone badge: fade-in + scale-up */
        @keyframes badge-enter {
          0% { opacity: 0; transform: scale(0.8); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .milestone-badge {
          animation: badge-enter 0.5s ease-out forwards;
        }

        /* Glow pulsante para hitos importantes */
        @keyframes milestone-glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor, 0 0 25px currentColor; }
        }
        .milestone-glow {
          animation: milestone-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="relative lg:min-h-screen">
      {/* Navegación */}
      <div className="flex justify-between items-center w-full px-4 pt-2 overflow-visible">
        <button
          onClick={handleBack}
          className="text-sm text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
        >
          ← Volver
        </button>
        
        {/* Acciones */}
        <div className="flex gap-2">
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsTransferModalOpen(true)} 
              aria-label="Transferir fondos"
              className="rounded-full p-2 transition-all duration-300 text-secondary-500 dark:text-secondary-400 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)]"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 
                            bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 
                            text-[10px] rounded shadow-lg z-50 pointer-events-none
                            opacity-0 invisible transition-opacity duration-300 group-hover:opacity-100 group-hover:visible">
              Transferir a otro bolsillo
            </div>
          </div>
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditModalOpen(true)} 
              aria-label="Editar bolsillo"
              className="rounded-full p-2 transition-all duration-300 text-secondary-500 dark:text-secondary-400 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)]"
            >
              <PencilIcon className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 
                            bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 
                            text-[10px] rounded shadow-lg z-50 pointer-events-none
                            opacity-0 invisible transition-opacity duration-300 group-hover:opacity-100 group-hover:visible">
              Editar Bolsillo
            </div>
          </div>
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDeleteModalOpen(true)} 
              aria-label="Eliminar bolsillo"
              className="rounded-full p-2 transition-all duration-300 text-secondary-500 dark:text-secondary-400 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)]"
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 
                            bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 
                            text-[10px] rounded shadow-lg z-50 pointer-events-none
                            opacity-0 invisible transition-opacity duration-300 group-hover:opacity-100 group-hover:visible">
              Eliminar Bolsillo
            </div>
          </div>
        </div>
      </div>

      {/* Bloque de contenido central */}
      <div className="relative mt-4 flex flex-col items-center justify-center">
        {/* CAPI con Badge */}
        <div className="relative w-24 h-24 overflow-visible mb-4">
          {/* Badge flotante */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 whitespace-nowrap shadow-sm border border-purple-200 dark:border-purple-800">
            {isGoal ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Objetivo
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Depósito
              </>
            )}
          </div>
          {/* Glow de fondo según mood */}
          <div
            className="absolute inset-0 rounded-full dark:hidden"
            style={{
              background: `radial-gradient(circle, ${pocketMood.glowColor} 0%, transparent 70%)`,
              transform: 'scale(1.6)',
            }}
          />
          <div
            className="absolute inset-0 rounded-full hidden dark:block"
            style={{
              background: `radial-gradient(circle, ${pocketMood.glowColorDark} 0%, transparent 70%)`,
              transform: 'scale(1.6)',
            }}
          />
          <img
            src={pocketMood.image}
            alt={pocketMood.status}
            title={pocketMood.status}
            className="relative w-full h-full object-cover transition-transform duration-300 scale-150 [mask-image:radial-gradient(circle,black_60%,transparent_75%)] dark:invert"
          />
        </div>

        {/* Bloque de Información Descriptiva */}
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">
            {formatCurrency(netAmount)}
          </span>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white [.dim_&]:text-amber-900">
            {pocket.name}
          </h1>
          {pocket.motivation && (
            <div className="mt-4 pl-3 border-l-4 border-purple-500">
              <p className="mantra-pulse-unified flex items-center gap-2 text-sm italic font-light text-secondary-800 dark:text-secondary-100 [.dim_&]:text-amber-800">
                <svg className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400 stroke-purple-600 dark:stroke-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
                {pocket.motivation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Financial Strip — KPIs (aparecen post-animación) ═══ */}
      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: showKPIs ? '200px' : '0',
          opacity: showKPIs ? 1 : 0,
          transform: showKPIs ? 'translateY(0)' : 'translateY(-16px)',
        }}
      >
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-5 py-6 border-y border-secondary-100 dark:border-secondary-700 my-6">
          {/* Aportado */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-green-600 dark:text-green-400 [.dim_&]:text-green-500 font-bold text-lg pulse-fast flex-shrink-0">↑</span>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xl font-extrabold text-green-600 dark:text-green-400 [.dim_&]:text-green-500">
                {formatCurrency(totalDeposited)}
              </span>
              <span className="text-[11px] font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Aportado</span>
            </div>
          </div>
          {/* Voluntad */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-amber-600 dark:text-amber-400 [.dim_&]:text-amber-500 font-bold text-lg drop-shadow-[0_0_2px_currentColor] flex-shrink-0">⚡</span>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 [.dim_&]:text-amber-500">
                {efficiency.toFixed(1)}%
              </span>
              <span className="text-[11px] font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Voluntad</span>
            </div>
          </div>
          {/* Retirado */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-red-600 dark:text-red-400 [.dim_&]:text-red-500 font-bold text-lg pulse-slow flex-shrink-0">↓</span>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xl font-extrabold text-red-600 dark:text-red-400 [.dim_&]:text-red-500">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-[11px] font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">Retirado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Animación Narrativa ═══ */}
      <div className="relative overflow-hidden rounded-lg border border-secondary-100 dark:border-secondary-700 p-4 my-4 mx-4">
        {isGoal ? (
          <HistoryProgressArc
            currentAmount={pocket.accumulatedAmount}
            goal={pocket.goal}
            animate={animate}
            onReady={() => {
              if (pocket?.id) animatedPockets.add(pocket.id);
              setShowKPIs(true);
            }}
          />
        ) : (
          <HistorySparkline
            pocket={pocket}
            animate={animate}
            onReady={() => {
              if (pocket?.id) animatedPockets.add(pocket.id);
              setShowKPIs(true);
            }}
          />
        )}

        {/* ═══ Stats compartidos: ritmo mensual + activo desde ═══ */}
        <div className="flex flex-row justify-between items-center text-xs text-secondary-500 dark:text-secondary-400 mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-700">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            <span>Ritmo mensual: {formatCurrency(Math.round(monthlyAverage))}/mes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>Activo desde: {activeSince}</span>
          </div>
        </div>
      </div>

      {/* ═══ Activity Feed: Historial de Movimientos ═══ */}
      <h2 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white px-4">
        Historial de Movimientos
      </h2>
      {groupedHistory.length === 0 ? (
        <p className="text-secondary-500 dark:text-secondary-400 text-sm px-4">
          No hay movimientos registrados.
        </p>
      ) : (
        <div className="px-4">
          {groupedHistory.map(([dateKey, items], idx) => (
            <div key={dateKey} className={idx > 0 ? 'pt-8' : ''}>
              {/* ═══ Date Header ═══ */}
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500 pb-1.5 mb-3 border-b border-secondary-300/70 dark:border-secondary-600/60">
                {formatShortDate(dateKey)}
              </h3>

              {items.map((item, i) => (
                <div key={item.id}>
                  {/* ═══ Item del Timeline ═══ */}
                  <div className="flex items-start justify-between text-sm">
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <span className={`mt-0.5 ${getMovementColor(item)} flex-shrink-0 flex items-center justify-center`}>
                        {item.type === 'transfer' ? (
                          <ArrowsRightLeftIcon className="w-4 h-4" />
                        ) : (
                          <span className="font-bold text-base leading-none">{getMovementIcon(item)}</span>
                        )}
                      </span>
                      <div>
                        {/* Línea 1: Tipo · Hora */}
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getMovementColor(item)}`}>
                            {getMovementLabel(item)}
                          </span>
                          {item.createdAt && (
                            <>
                              <span className="text-secondary-400 dark:text-secondary-500">·</span>
                              <span className="text-xs text-secondary-500 dark:text-secondary-400 font-mono">
                                {formatTime(item.createdAt)}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Línea 2: Razón/Descripción */}
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                          {item.type === 'transfer' && item.direction === 'incoming' && item.sourcePocketId
                            ? `Procedente de ${pocketNameMap.get(item.sourcePocketId) || item.sourcePocketId.slice(0, 8)}`
                            : item.type === 'transfer' && item.direction === 'outgoing' && item.targetPocketId
                              ? `Hacia ${pocketNameMap.get(item.targetPocketId) || item.targetPocketId.slice(0, 8)}`
                              : getDefaultReason(item)}
                        </p>
                      </div>
                    </div>
                    {/* Monto */}
                    <span className={`font-bold text-sm ${getMovementColor(item)}`}>
                      {getMovementSign(item)}{formatCurrency(item.amount)}
                    </span>
                  </div>
                  {/* Divider entre items del mismo grupo */}
                  {i < items.length - 1 && (
                    <div className="border-b border-secondary-100/50 dark:border-secondary-700/20 my-3" />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Ver más */}
          {historyQuery.hasNextPage && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => historyQuery.fetchNextPage()}
                disabled={historyQuery.isFetchingNextPage}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {historyQuery.isFetchingNextPage ? 'Cargando...' : 'Ver más'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Modals ═══ */}
      <DeletePocketModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        pocket={pocket}
        onConfirm={handleDelete}
        isLoading={deletePocketMutation.isPending}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Bolsillo"
        size="lg"
        showCloseButton={false}
      >
        <PocketForm
          pocket={pocket}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={updatePocketMutation.isPending}
        />
      </Modal>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sourcePocketId={id || ''}
      />
    </div>
    </>
  );
};

export default PocketDetailPage;

