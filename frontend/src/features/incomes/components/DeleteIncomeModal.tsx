import React from 'react';
import { Income } from '../types/income.types';
import { formatCurrency, formatDate } from '../../../core/utils/format';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';

export interface DeleteIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: Income | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

const DeleteIncomeModal: React.FC<DeleteIncomeModalProps> = ({
  isOpen,
  onClose,
  income,
  onConfirm,
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  if (!income) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Ingreso"
      description="¿Estás seguro de que deseas eliminar este ingreso?"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Esta acción no se puede deshacer
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  El ingreso será eliminado permanentemente del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Monto:
            </span>
            <span className="text-lg font-semibold text-secondary-900 dark:text-white">
              {formatCurrency(income.amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Motivo:
            </span>
            <span className="text-sm text-secondary-900 dark:text-white">
              {income.reason}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Fecha:
            </span>
            <span className="text-sm text-secondary-900 dark:text-white">
              {formatDate(income.date)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteIncomeModal;