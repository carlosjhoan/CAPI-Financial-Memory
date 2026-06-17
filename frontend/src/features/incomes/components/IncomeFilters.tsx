import React from 'react';
import { IncomeFilters } from '../types/income.types';
import DatePicker from '../../../shared/components/DatePicker';
import Button from '../../../shared/components/Button';
import Card, { CardContent } from '../../../shared/components/Card';

export interface IncomeFiltersProps {
  filters: IncomeFilters;
  onFiltersChange: (filters: Partial<IncomeFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const IncomeFiltersComponent: React.FC<IncomeFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ startDate: e.target.value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ endDate: e.target.value || undefined });
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Filtros
            </h3>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Fecha desde"
              value={filters.startDate || ''}
              onChange={handleStartDateChange}
              helperText="Filtrar ingresos desde esta fecha"
            />
            
            <DatePicker
              label="Fecha hasta"
              value={filters.endDate || ''}
              onChange={handleEndDateChange}
              helperText="Filtrar ingresos hasta esta fecha"
            />
          </div>
          
          {hasActiveFilters && (
            <div className="pt-2">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                <span className="font-medium">Filtros activos:</span>
                {filters.startDate && ` Desde ${filters.startDate}`}
                {filters.endDate && ` Hasta ${filters.endDate}`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeFiltersComponent;