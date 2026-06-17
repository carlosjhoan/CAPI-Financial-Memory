import React from 'react';
import Button from './Button';
import { PaginatedMeta } from '../../core/types/base.types';

export interface PaginationControlsProps {
  pagination: PaginatedMeta;
  onPageChange: (page: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showPageInfo?: boolean;
  className?: string;
}

/**
 * Reusable pagination controls component
 * Used in all paginated lists (incomes, expenses, loans, etc.)
 */
const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  size = 'sm',
  showPageInfo = true,
  className = '',
}) => {
  const { page, totalPages, total } = pagination;

  // Safety: clamp page to valid range (defensive, useAutoCorrectPage should prevent this)
  const safePage = Math.min(page, totalPages);
  const safeTotalPages = Math.max(totalPages, 1);

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return showPageInfo ? (
      <div className={`text-sm text-secondary-500 dark:text-secondary-400 ${className}`}>
        {total} {total === 1 ? 'registro' : 'registros'}
      </div>
    ) : null;
  }
  
  const handlePrevious = () => {
    if (safePage > 1) {
      onPageChange(safePage - 1);
    }
  };

  const handleNext = () => {
    if (safePage < safeTotalPages) {
      onPageChange(safePage + 1);
    }
  };
  
  return (
    <div className={`flex items-center justify-between pt-3 border-t border-secondary-200 dark:border-secondary-700 ${className}`}>
      {showPageInfo && (
        <div className="text-sm text-secondary-500 dark:text-secondary-400">
          Página <span className="font-medium">{safePage}</span> de{' '}
          <span className="font-medium">{safeTotalPages}</span>
          <span className="ml-2 text-secondary-400">({total} total)</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrevious}
          disabled={safePage === 1}
          variant="outline"
          size={size}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </Button>

        <Button
          onClick={handleNext}
          disabled={safePage >= safeTotalPages}
          variant="outline"
          size={size}
        >
          Siguiente
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;