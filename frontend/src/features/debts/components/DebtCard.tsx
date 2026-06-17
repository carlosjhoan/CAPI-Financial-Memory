import React, { useState } from 'react';
import { Debt } from '../types/debt.types';
import { formatCurrency } from '../../../core/utils/format';
import MessageReveal from '../../../shared/components/MessageReveal';
import type { AccentColor } from '../../../shared/components/MonthlyBreakdownGrid';

export interface DebtCardProps {
  debt: Debt;
  onClick?: (debt: Debt) => void;
  onEdit?: (debt: Debt) => void;
  onDelete?: (debt: Debt) => void;
  onRegisterPayment?: (debt: Debt) => void;
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

const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onClick,
  onEdit,
  onDelete,
  onRegisterPayment,
  accentColor = 'red',
}) => {
  const [isIconHovered, setIsIconHovered] = useState(false);

  const borderClasses = ACCENT_BORDER_MAP[accentColor] ?? ACCENT_BORDER_MAP.red;
  const remainingAmount = debt.finalAmount - debt.paidAmount;
  const progressPercentage = debt.finalAmount > 0
    ? Math.min((debt.paidAmount / debt.finalAmount) * 100, 100)
    : 0;
  const isFullyPaid = remainingAmount <= 0;

  const handleClick = () => {
    if (onClick) {
      onClick(debt);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(debt);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(debt);
    }
  };

  const handleRegisterPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegisterPayment) {
      onRegisterPayment(debt);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-secondary-800 rounded-lg border cursor-pointer border-secondary-200 dark:border-secondary-700 ${borderClasses.light} ${borderClasses.dark}`}
      onClick={handleClick}
    >
      <MessageReveal message={debt.reason} label="Motivo" isHovered={isIconHovered}>
        {/* ═══ TOP SECTION: centered ═══ */}
        <div className="flex flex-col items-center pt-4 pb-2 px-4">
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(debt.finalAmount)}
          </span>

          {/* Entidad */}
          <span className="text-sm font-medium text-secondary-500 dark:text-white dark:font-bold mt-0.5">
            {debt.lender}
          </span>

          {/* Cuotas pagadas / faltantes */}
          <span className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
            Cuotas: {(debt.payments as unknown as number) ?? 0} / {debt.months}
          </span>
        </div>

        {/* ═══ PROGRESS BAR ═══ */}
        <div className="px-4 pb-3">
          <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </MessageReveal>

      {/* ═══ CARD-LEVEL BLUR — cubre footer y hover actions ═══ */}
      {isIconHovered && (
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md rounded-lg z-[1]" />
      )}

      {/* ═══ FOOTER ═══ */}
      {/* Eye icon — centered */}
      <div className="relative z-20 flex justify-center pb-3">
        <div
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
        >
          <svg
            className={`w-5 h-5 cursor-pointer transition-all duration-300 ${
              isIconHovered
                ? 'text-purple-600 dark:text-white [filter:drop-shadow(0_0_8px_rgba(147,51,234,0.5))] dark:[filter:drop-shadow(0_0_12px_rgba(255,255,255,0.9))]'
                : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
      </div>

      {/* Status badge — bottom right */}
      <div className="absolute bottom-3 right-3">
        {isFullyPaid ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Pagada
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Activa
          </span>
        )}
      </div>

      {/* ═══ Hover Actions (sin cambios) ═══ */}
      {(onEdit || onDelete || onRegisterPayment) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRegisterPayment && (
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

export default React.memo(DebtCard);
