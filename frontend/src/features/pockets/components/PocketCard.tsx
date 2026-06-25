import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pocket } from '../types/pocket.types';
import { formatCurrency, monthNamesShort } from '../../../core/utils/format';
import MiniLineChart from '@/shared/components/MiniLineChart';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export interface PocketCardProps {
  pocket: Pocket;
  onEdit?: (pocket: Pocket) => void;
  onDelete?: (pocket: Pocket) => void;
}

const PocketCard: React.FC<PocketCardProps> = ({ pocket, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { lastDate, withdrawalCount, transferOutCount, transferTotal } = useMemo(() => {
    const incomes = pocket.incomes || [];
    const expenses = pocket.expenses || [];
    const transfers = pocket.transfers || [];

    // Transferencias
    const outgoingTransfers = transfers.filter(t => t.direction === 'outgoing');

    const allActivities = [...incomes, ...expenses, ...transfers];
    const latestActivity = allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const dateObj = latestActivity 
      ? new Date(latestActivity.date) 
      : new Date(pocket.createdAt);

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = monthNamesShort[dateObj.getMonth()].toUpperCase();
    
    return {
      lastDate: `${day} ${month}`,
      withdrawalCount: expenses.length,
      transferOutCount: outgoingTransfers.length,
      transferTotal: transfers.length,
    };
  }, [pocket.incomes, pocket.expenses, pocket.transfers, pocket.createdAt]);

  const isGoal = pocket.type === 'goal';
  const percentage = isGoal && pocket.goal > 0
    ? Math.min((pocket.accumulatedAmount / pocket.goal) * 100, 100)
    : 0;
  const isGoalReached = isGoal && pocket.accumulatedAmount >= pocket.goal && pocket.goal > 0;

  const handleClick = () => {
    navigate(`/pockets/${pocket.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(pocket);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(pocket);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-600 transition-all duration-200 cursor-pointer flex flex-col h-[210px] lg:h-[200px] justify-between overflow-hidden"
    >
      {/* Type Badge */}
      <div className="absolute top-3 left-3">
        {isGoal ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Objetivo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Depósito
          </span>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 pt-3 pb-0 flex-1 flex flex-col justify-between">
          {/* Block 1 - arriba: amount, name, deposit count */}
          <div className="flex flex-col items-center">
            {/* Monto */}
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(pocket.accumulatedAmount)}
            </div>
            
            {/* Nombre */}
            <h3 className="text-sm font-bold text-secondary-900 dark:text-white mt-1">
              {pocket.name}
            </h3>

            {/* Separador */}
            <div className="border-b border-secondary-300 dark:border-secondary-600 opacity-50 w-16 mx-auto my-2" />
            
            {/* Stats / Conteo de actividad */}
            <div className="flex items-center gap-2 justify-center text-xs text-secondary-500 dark:text-secondary-400 mt-2">
              <span className="inline-flex items-center gap-1 text-secondary-500 dark:text-secondary-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {lastDate}
              </span>
              <span className="text-secondary-300 dark:text-secondary-600">•</span>
              <span className="text-green-600 dark:text-green-500 font-bold flex items-center">
                ↑ {pocket.incomes?.length || 0}
              </span>
              <span className="text-secondary-300 dark:text-secondary-600">•</span>
              <span className="text-red-600 dark:text-red-500 font-bold flex items-center">
                ↓ {withdrawalCount}
              </span>
              <span className="text-secondary-300 dark:text-secondary-600">•</span>
              <span className="text-blue-500 dark:text-blue-400 font-bold flex items-center gap-0.5" title={`${transferOutCount} saliente(s), ${transferTotal - transferOutCount} entrante(s)`}>
                <ArrowsRightLeftIcon className="w-3 h-3" />
                {transferTotal}
              </span>
            </div>
          </div>

          {/* Block 2 - abajo: progress bar o MiniBarChart */}
          <div>
            {isGoal && (
              <div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2.5 mb-1">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 bg-green-500 dark:bg-green-400`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    {percentage.toFixed(2)}%
                  </span>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    Meta: {formatCurrency(pocket.goal)}
                  </span>
                </div>
              </div>
            )}
            {/* MiniLineChart for deposit type with data */}
            {!isGoal && (pocket.accumulatedAmount > 0 || (pocket.incomes && pocket.incomes.length > 0)) && (
              <div>
                <MiniLineChart
                  initialAmount={pocket.initialAmount ?? 0}
                  transactions={pocket.incomes ?? []}
                  createdAt={pocket.createdAt}
                  currentAccumulated={pocket.accumulatedAmount}
                />
              </div>
            )}

            {/* Empty state for deposit type without data */}
            {!isGoal && pocket.accumulatedAmount === 0 && (!pocket.incomes || pocket.incomes.length === 0) && (
              <div>
                <div className="text-center text-xs text-secondary-400 py-4">
                  Bolsillo vacío
                </div>
              </div>
            )}
          </div>
        </div>

      {/* ═══ Footer: Meta alcanzada badge (invisible reserva espacio) ═══ */}
      <div className={`flex items-center justify-center px-4 py-2 ${isGoalReached ? 'visible' : 'invisible'}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Meta alcanzada
        </span>
      </div>
    </div>
  );
};

export default React.memo(PocketCard);
