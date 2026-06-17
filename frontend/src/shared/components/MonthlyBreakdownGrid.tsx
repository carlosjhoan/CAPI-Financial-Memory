import React from 'react';
import { formatCurrency } from '../../core/utils/format';

export type AccentColor = 'green' | 'red' | 'primary' | 'blue' | 'amber' | 'orange';

export interface MonthlyBreakdownGridProps {
  /** Record of month name (e.g., "Enero", "Febrero", etc.) to amount */
  breakdown: Record<string, number>;
  /** Currently selected month */
  selectedMonth: string | null;
  /** Callback when a month is clicked */
  onMonthClick: (month: string) => void;
  /** Color accent for styling */
  accentColor?: AccentColor;
  /** Label for the grid */
  label?: string;
  /** Months to disable (not clickable, shown in gray) */
  disabledMonths?: string[];
  className?: string;
}

/**
 * Reusable monthly breakdown grid component
 * Displays 12 months in a grid with clickable items for yearly summary view
 * Used in EntityFinancialSection for yearly views
 */
const MonthlyBreakdownGrid: React.FC<MonthlyBreakdownGridProps> = ({
  breakdown,
  selectedMonth,
  onMonthClick,
  accentColor = 'green',
  label = 'Desglose Mensual',
  disabledMonths = [],
  className = '',
}) => {
  // Don't render if breakdown is empty
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return null;
  }

  // Get color classes based on state (selected, disabled, or default)
  const getColorClasses = (isSelected: boolean, isDisabled: boolean) => {
    // Disabled months: gray background, no pointer, no hover
    if (isDisabled) {
      return 'rounded p-1 border bg-secondary-100 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 cursor-not-allowed opacity-60';
    }
    
    const baseClasses = 'rounded p-1 shadow-sm cursor-pointer transition-colors border';
    
    if (isSelected) {
      switch (accentColor) {
        case 'green':
          return `${baseClasses} shadow-md ring-2 ring-green-500/50 bg-green-300 dark:bg-green-900/70 border-green-600 dark:border-green-500`;
        case 'red':
          return `${baseClasses} shadow-md ring-2 ring-red-500/50 bg-red-300 dark:bg-red-900/70 border-red-600 dark:border-red-500`;
        case 'primary':
          return `${baseClasses} shadow-md ring-2 ring-primary-500/50 bg-primary-300 dark:bg-primary-900/70 border-primary-600 dark:border-primary-500`;
        case 'blue':
          return `${baseClasses} shadow-md ring-2 ring-blue-500/50 bg-blue-300 dark:bg-blue-900/70 border-blue-600 dark:border-blue-500`;
        case 'amber':
          return `${baseClasses} shadow-md ring-2 ring-amber-500/50 bg-amber-300 dark:bg-amber-900/70 border-amber-600 dark:border-amber-500`;
        case 'orange':
          return `${baseClasses} shadow-md ring-2 ring-orange-500/50 bg-orange-300 dark:bg-orange-900/70 border-orange-600 dark:border-orange-500`;
        default:
          return `${baseClasses} shadow-md ring-2 ring-green-500/50 bg-green-300 dark:bg-green-900/70 border-green-600 dark:border-green-500`;
      }
    }
    
    switch (accentColor) {
      case 'green':
        return `${baseClasses} bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-green-300 dark:border-green-700`;
      case 'red':
        return `${baseClasses} bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-300 dark:border-red-700`;
      case 'primary':
        return `${baseClasses} bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 border-primary-300 dark:border-primary-700`;
      case 'blue':
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-300 dark:border-blue-700`;
      case 'amber':
        return `${baseClasses} bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700`;
      case 'orange':
        return `${baseClasses} bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 border-orange-300 dark:border-orange-700`;
      default:
        return `${baseClasses} bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-green-300 dark:border-green-700`;
    }
  };

  // Get text classes based on state
  const getTextClasses = (isSelected: boolean, isDisabled: boolean, isMonthName: boolean) => {
    // Disabled: gray text
    if (isDisabled) {
      return 'text-secondary-400 dark:text-secondary-500';
    }
    
    if (isSelected) {
      if (isMonthName) {
        switch (accentColor) {
          case 'green':
            return '!text-green-700 dark:!text-green-200';
          case 'red':
            return '!text-red-700 dark:!text-red-200';
          case 'primary':
            return '!text-primary-700 dark:!text-primary-200';
          case 'blue':
            return '!text-blue-700 dark:!text-blue-200';
          case 'amber':
            return '!text-amber-700 dark:!text-amber-200';
          case 'orange':
            return '!text-orange-700 dark:!text-orange-200';
          default:
            return '!text-green-700 dark:!text-green-200';
        }
      }
      return '!text-black dark:!text-white';
    }
    
    if (isMonthName) {
      return 'text-secondary-500 dark:text-secondary-400';
    }
    return 'text-secondary-900 dark:text-white';
  };

  // Handle click - do nothing if disabled
  const handleClick = (month: string) => {
    if (!disabledMonths.includes(month)) {
      onMonthClick(month);
    }
  };

  return (
    <div className={className}>
      {label && (
        <h4 className="text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
        </h4>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {Object.entries(breakdown).map(([month, amount]) => {
          const isSelected = selectedMonth === month;
          const isDisabled = disabledMonths.includes(month);
          
          return (
            <div
              key={month}
              onClick={() => handleClick(month)}
              className={getColorClasses(isSelected, isDisabled)}
            >
              <p className={`text-xs font-bold ${getTextClasses(isSelected, isDisabled, true)}`}>
                {month.substring(0, 3)}
              </p>
              <p className={`text-xs font-bold ${getTextClasses(isSelected, isDisabled, false)}`}>
                {formatCurrency(amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyBreakdownGrid;