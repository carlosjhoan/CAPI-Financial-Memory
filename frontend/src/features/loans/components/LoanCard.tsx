import React from 'react';
import { Loan } from '../types/loan.types';
import { formatCurrency, formatDate } from '../../../core/utils/format';
import type { AccentColor } from '../../../shared/components/MonthlyBreakdownGrid';

export interface LoanCardProps {
  loan: Loan;
  onClick?: (loan: Loan) => void;
  onEdit?: (loan: Loan) => void;
  onDelete?: (loan: Loan) => void;
  onRegisterPayment?: (loan: Loan) => void;
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

const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onClick,
  onEdit,
  onDelete,
  onRegisterPayment,
  accentColor = 'blue',
}) => {
  const borderClasses = ACCENT_BORDER_MAP[accentColor] ?? ACCENT_BORDER_MAP.blue;

  // Calcular expected return: initialAmount * (1 + interestRate/100)
  const expectedReturn = loan.initialAmount * (1 + loan.interestRate / 100);
  const remainingAmount = loan.remainingAmount ?? (expectedReturn - loan.paidAmount);
  const progressPercentage = expectedReturn > 0
    ? Math.min((loan.paidAmount / expectedReturn) * 100, 100)
    : 0;
  const isPaid = remainingAmount <= 0;

  const handleClick = () => {
    if (onClick) {
      onClick(loan);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(loan);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(loan);
  };

  const handleRegisterPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegisterPayment) onRegisterPayment(loan);
  };

  return (
    <div
      className={`group relative bg-white dark:bg-secondary-800 rounded-lg border p-4 cursor-pointer border-secondary-200 dark:border-secondary-700 ${borderClasses.light} ${borderClasses.dark}`}
      onClick={handleClick}
    >
      <div className="flex flex-col space-y-3">
        {/* Header — initialAmount en azul */}
        <div className="flex justify-between items-start">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(loan.initialAmount)}
          </span>
        </div>

        {/* Details — interés + cuota */}
        <div className="space-y-1">
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            {loan.interestRate}% interés · {formatCurrency(loan.installment)}/mes
          </div>
          <div className="text-sm font-medium text-secondary-900 dark:text-white">
            {loan.debtor}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-secondary-600 dark:text-secondary-400">Pagado:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(loan.paidAmount)} ({progressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-secondary-600 dark:text-secondary-400">Restante:</span>
            <span className={`font-medium ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>

        {/* Date + Status Badge */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex flex-col">
            <span className="text-secondary-500 dark:text-secondary-400">
              {formatDate(loan.date)}
            </span>
          </div>
          {isPaid ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Pagado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              Activo
            </span>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      {(onEdit || onDelete || onRegisterPayment) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRegisterPayment && !isPaid && (
            <button
              onClick={handleRegisterPayment}
              className="p-1.5 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Registrar pago"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
      )}
    </div>
  );
};

export default React.memo(LoanCard);
