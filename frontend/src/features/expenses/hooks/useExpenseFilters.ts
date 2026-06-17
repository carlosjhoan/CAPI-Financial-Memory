import { useFilterContext } from '../../../core/contexts';

/**
 * Hook para acceder a los filtros de sesión compartidos vía FilterContext.
 * Reemplaza el uso local de useFilters() que creaba instancias duplicadas.
 */
export function useExpenseFilters() {
  const {
    filters,
    debouncedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  } = useFilterContext();

  return {
    filters,
    debouncedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}
