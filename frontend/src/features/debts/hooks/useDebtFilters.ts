import { useFilterContext } from '../../../core/contexts';

/**
 * Hook para acceder a los filtros de sesión compartidos vía FilterContext.
 * Reemplaza el uso local de useState que creaba instancias duplicadas (Page vs List).
 */
export function useDebtFilters() {
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