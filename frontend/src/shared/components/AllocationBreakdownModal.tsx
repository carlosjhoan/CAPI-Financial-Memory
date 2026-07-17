import React from 'react';
import Modal from './Modal';
import { formatCurrency } from '../../core/utils/format';

interface Allocation {
  pocketName: string;
  amount: number;
}

interface AllocationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  allocations: Allocation[];
  accentColor: string;
}

const AllocationBreakdownModal: React.FC<AllocationBreakdownModalProps> = ({
  isOpen,
  onClose,
  title,
  allocations,
  accentColor,
}) => {
  const total = allocations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" glass glassBackdrop accentColor={accentColor}>
      <div className="space-y-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
              <th className="text-left py-2 font-medium">Bolsillo</th>
              <th className="text-right py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {allocations.map((a, i) => (
              <tr key={i}>
                <td className="py-2 text-secondary-900 dark:text-white">{a.pocketName}</td>
                <td className="py-2 text-right font-medium" style={{ color: `rgba(${accentColor},0.65)` }}>
                  {formatCurrency(a.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-secondary-300 dark:border-secondary-600 font-semibold">
              <td className="py-2 text-secondary-900 dark:text-white">Total</td>
              <td className="py-2 text-right font-semibold" style={{ color: `rgb(${accentColor})` }}>
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>
  );
};

export default AllocationBreakdownModal;
