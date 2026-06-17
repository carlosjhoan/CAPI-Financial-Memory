import React from 'react';
import { Expense } from '../types/expense.types';
import { formatCurrency, formatDate } from '../../../core/utils/format';
import type { AccentColor } from '../../../shared/components/MonthlyBreakdownGrid';

export interface ExpenseCardProps {
  expense: Expense;
  onClick?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  accentColor?: AccentColor;
}

const ACCENT_BORDER_MAP: Record<NonNullable<AccentColor>, { light: string; dark: string }> = {
  green: { light: 'hover:border-green-400', dark: 'dark:hover:border-green-500' },
  red: { light: 'hover:border-red-400', dark: 'dark:hover:border-red-500' },
  primary: { light: 'hover:border-primary-400', dark: 'dark:hover:border-primary-500' },
  blue: { light: 'hover:border-blue-400', dark: 'dark:hover:border-blue-500' },
  amber: { light: 'hover:border-amber-400', dark: 'dark:hover:border-amber-500' },
  orange: { light: 'hover:border-orange-400', dark: 'dark:hover:border-orange-500' },
};

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onClick,
  onEdit,
  onDelete,
  accentColor = 'orange',
}) => {
  const borderClasses = ACCENT_BORDER_MAP[accentColor] ?? ACCENT_BORDER_MAP.orange;

  const handleClick = () => {
    if (onClick) {
      onClick(expense);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(expense);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(expense);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-secondary-800 rounded-lg border p-3 cursor-pointer border-secondary-200 dark:border-secondary-700 ${borderClasses.light} ${borderClasses.dark}`}
      onClick={handleClick}
    >
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-start">
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(expense.amount)}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-secondary-900 dark:text-white">
            {expense.reason}
          </p>
        </div>

        <div className="text-xs text-secondary-500 dark:text-secondary-400">
          {formatDate(expense.date)}
        </div>
      </div>

      {/* Hover Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="Editar"
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

export default React.memo(ExpenseCard);
