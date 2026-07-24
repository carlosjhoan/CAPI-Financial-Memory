import React, { useState, useMemo } from 'react';
import { Income } from '../types/income.types';
import { formatCurrency, formatDate } from '../../../core/utils/format';
import type { AccentColor } from '../../../shared/components/MonthlyBreakdownGrid';

export interface IncomeCardProps {
  income: Income;
  onClick?: (income: Income) => void;
  onEdit?: (income: Income) => void;
  onDelete?: (income: Income) => void;
  accentColor?: AccentColor;
  featureAdjustments?: boolean;
}

const ACCENT_BORDER_MAP: Record<NonNullable<AccentColor>, { light: string; dark: string }> = {
  green: { light: 'hover:border-green-400', dark: 'dark:hover:border-green-500' },
  red: { light: 'hover:border-red-400', dark: 'dark:hover:border-red-500' },
  primary: { light: 'hover:border-primary-400', dark: 'dark:hover:border-primary-500' },
  blue: { light: 'hover:border-blue-400', dark: 'dark:hover:border-blue-500' },
  amber: { light: 'hover:border-amber-400', dark: 'dark:hover:border-amber-500' },
  orange: { light: 'hover:border-orange-400', dark: 'dark:hover:border-orange-500' },
};

interface TimelineEntry {
  date: string;
  runningTotal: number;
  label: string;
  isCurrent: boolean;
  isOriginal: boolean;
}

const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  onClick,
  onEdit,
  onDelete,
  accentColor = 'green',
  featureAdjustments = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const borderClasses = ACCENT_BORDER_MAP[accentColor] ?? ACCENT_BORDER_MAP.green;
  const hasAdjustments = featureAdjustments && income.adjustments && income.adjustments.length > 0;
  const displayAmount = hasAdjustments && income.netAmount != null ? income.netAmount : income.amount;

  // Build running-total timeline from adjustments (newest first)
  const timeline: TimelineEntry[] = useMemo(() => {
    if (!hasAdjustments) return [];
    const sorted = [...income.adjustments!].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const entries: TimelineEntry[] = [
      { date: income.date, runningTotal: income.amount, label: 'Valor original', isCurrent: false, isOriginal: true },
    ];
    let running = income.amount;
    for (const adj of sorted) {
      running += adj.amount;
      entries.push({
        date: adj.date,
        runningTotal: running,
        label: adj.reason.replace('[Ajuste] ', ''),
        isCurrent: false,
        isOriginal: false,
      });
    }
    // Reverse: newest first
    entries.reverse();
    entries[0].isCurrent = true;
    entries[0].label = 'Actual';
    return entries;
  }, [income.adjustments, income.amount, hasAdjustments]);

  const handleClick = () => {
    if (hasAdjustments) {
      setExpanded(!expanded);
    }
    if (onClick) {
      onClick(income);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(income);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(income);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-secondary-800 rounded-lg border p-3 cursor-pointer border-secondary-200 dark:border-secondary-700 ${borderClasses.light} ${borderClasses.dark}`}
      onClick={handleClick}
    >
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-start">
          <span className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(displayAmount)}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-secondary-900 dark:text-white">
            {income.reason}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          <span>{formatDate(income.date)}</span>
          {hasAdjustments && (
            <>
              <span className="text-secondary-300 dark:text-secondary-600">·</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-secondary-400 dark:text-secondary-500">Ajustado</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Expanded running-total timeline */}
      {hasAdjustments && expanded && (
        <div className="mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-[11px] font-semibold text-secondary-400 dark:text-secondary-500 mb-2 uppercase tracking-wider">
            Historial
          </p>
          <div className="space-y-0">
            {timeline.map((entry, idx) => (
              <div key={idx} className="flex items-stretch gap-2">
                {/* Timeline dot + connector */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`w-2 h-2 rounded-full ring-2 ring-white dark:ring-secondary-800 ${
                      entry.isCurrent
                        ? 'bg-green-500'
                        : entry.isOriginal
                          ? 'bg-secondary-300 dark:bg-secondary-600'
                          : 'bg-primary-500'
                    }`}
                  />
                  {idx < timeline.length - 1 && (
                    <div className="w-px flex-1 min-h-[20px] bg-secondary-200 dark:bg-secondary-700" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-secondary-400 dark:text-secondary-500">
                      {formatDate(entry.date)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        entry.isCurrent
                          ? 'text-green-600 dark:text-green-400'
                          : entry.isOriginal
                            ? 'text-secondary-500 dark:text-secondary-400'
                            : 'text-secondary-700 dark:text-secondary-300'
                      }`}
                    >
                      {formatCurrency(entry.runningTotal)}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-tight truncate ${
                      entry.isCurrent || entry.isOriginal
                        ? 'text-secondary-400 dark:text-secondary-500'
                        : 'text-secondary-500 dark:text-secondary-400'
                    }`}
                  >
                    {entry.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
               title="Ajustar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(IncomeCard);
