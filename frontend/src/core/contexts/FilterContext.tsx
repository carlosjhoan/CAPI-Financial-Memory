/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import type { SessionFilterType } from '../../shared/components/SessionFilters';
import type { BaseFilters } from '../types/base.types';

// ==========================================
// TYPES
// ==========================================

export interface FilterContextValue {
  /** El tipo de filtro activo: 'all' | 'yearly' | 'monthly' | 'dateRange' */
  filterType: SessionFilterType;
  /** Los filtros activos (año, mes, rango de fechas) */
  filters: BaseFilters;
  /** Filtros con debounce de 300ms para queries */
  debouncedFilters: BaseFilters;
  /** Si hay filtros activos distintos de 'all' */
  hasActiveFilters: boolean;
  /** Año seleccionado (para filtros yearly/monthly) */
  selectedYear: number;
  /** Mes seleccionado (para filtro monthly, 1-12) */
  selectedMonth: number;
  /** Actualiza solo el tipo de filtro */
  setFilterType: (type: SessionFilterType) => void;
  /** Actualiza filtros parciales (merge) */
  updateFilters: (updates: Partial<BaseFilters>) => void;
  /** Limpia filtros y vuelve a 'all' */
  clearFilters: () => void;
  /** Actualiza año seleccionado (solo cambia el year, no filterType) */
  setSelectedYear: (year: number) => void;
  /** Actualiza mes seleccionado (solo cambia el month, no filterType) */
  setSelectedMonth: (month: number) => void;
}

// ==========================================
// CONTEXT
// ==========================================

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

// ==========================================
// CONSTANTS
// ==========================================

const DEBOUNCE_MS = 300;

const initialFilters: BaseFilters = {};

// ==========================================
// PROVIDER
// ==========================================

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filterType, setFilterType] = useState<SessionFilterType>('all');
  const [filters, setFilters] = useState<BaseFilters>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<BaseFilters>(initialFilters);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  // Derive hasActiveFilters
  const hasActiveFilters = useMemo(
    () => !!(filters.startDate || filters.endDate || filters.year || filters.month),
    [filters],
  );

  // Reset to 'all' when clearing
  const clearFilters = useCallback(() => {
    setFilterType('all');
    setFilters(initialFilters);
    setDebouncedFilters(initialFilters);
  }, []);

  // Update filters (merge with existing)
  const updateFilters = useCallback((updates: Partial<BaseFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Sync selectedYear/month into filters when filterType changes
  useEffect(() => {
    if (filterType === 'yearly') {
      updateFilters({ year: selectedYear, month: undefined, startDate: undefined, endDate: undefined });
    } else if (filterType === 'monthly') {
      updateFilters({ year: selectedYear, month: selectedMonth, startDate: undefined, endDate: undefined });
    } else if (filterType === 'dateRange') {
      updateFilters({ year: undefined, month: undefined });
    } else if (filterType === 'all') {
      updateFilters({ year: undefined, month: undefined, startDate: undefined, endDate: undefined });
    }
  }, [filterType, selectedYear, selectedMonth, updateFilters]);

  const value = useMemo(
    () => ({
      filterType,
      filters,
      debouncedFilters,
      hasActiveFilters,
      selectedYear,
      selectedMonth,
      setFilterType,
      updateFilters,
      clearFilters,
      setSelectedYear,
      setSelectedMonth,
    }),
    [
      filterType,
      filters,
      debouncedFilters,
      hasActiveFilters,
      selectedYear,
      selectedMonth,
      updateFilters,
      clearFilters,
    ],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

// ==========================================
// HOOK
// ==========================================

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};