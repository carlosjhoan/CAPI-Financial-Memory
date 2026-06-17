import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomesService } from '../../../core/api';
import { CreateIncomeDto, UpdateIncomeDto, IncomeFilters, PaginatedMeta, Income } from '../types/income.types';
import { useGlobalToast } from '../../../core/hooks/useGlobalToast';

export const incomeKeys = {
  all: ['incomes'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (filters?: IncomeFilters) => [...incomeKeys.lists(), { filters }] as const,
  listPaginated: (filters?: IncomeFilters, page?: number, limit?: number) => [...incomeKeys.lists(), { filters, page, limit }] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...incomeKeys.details(), id] as const,
  summaries: () => [...incomeKeys.all, 'summary'] as const,
  monthlySummary: (year?: number, month?: number) => [...incomeKeys.summaries(), 'monthly', { year, month }] as const,
  yearlySummary: (year?: number) => [...incomeKeys.summaries(), 'yearly', { year }] as const,
  overallSummary: (startDate?: string, endDate?: string) =>
    [...incomeKeys.summaries(), 'overall', { startDate, endDate }] as const,
};

export function useIncomes(filters?: IncomeFilters) {
  return useQuery({
    queryKey: incomeKeys.list(filters),
    queryFn: () => incomesService.getAll(filters),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
  });
}

export function useIncomesPaginated(filters?: IncomeFilters, page: number = 1, limit: number = 6) {
  return useQuery<{ data: Income[]; meta: PaginatedMeta }>({
    queryKey: incomeKeys.listPaginated(filters, page, limit),
    queryFn: () => incomesService.getAllPaginated(filters, page, limit),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
    placeholderData: (previousData) => previousData,
  });
}

export function useIncome(id: string) {
  return useQuery({
    queryKey: incomeKeys.detail(id),
    queryFn: () => incomesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos — detalles rara vez cambian
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (incomeData: CreateIncomeDto) => incomesService.create(incomeData),
    onSuccess: (newIncome) => {
      // Invalidar quirúrgicamente — solo listas y summaries (no detalles individuales)
      queryClient.invalidateQueries({ queryKey: ['incomes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'summary'] });

      success('Ingreso creado', `El ingreso de $${newIncome.amount.toFixed(2)} ha sido creado exitosamente`);
    },
    onError: (err: any) => {
      showError('Error al crear ingreso', err.message || 'No se pudo crear el ingreso');
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeDto }) => 
      incomesService.update(id, data),
    onSuccess: (updatedIncome, variables) => {
      // Actualizar la cache del detalle específico
      queryClient.setQueryData(incomeKeys.detail(variables.id), updatedIncome);
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['incomes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'summary'] });

      success('Ingreso actualizado', `El ingreso ha sido actualizado exitosamente`);
    },
    onError: (err: any) => {
      showError('Error al actualizar ingreso', err.message || 'No se pudo actualizar el ingreso');
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => incomesService.delete(id),
    onSuccess: (_, id) => {
      // Remover la cache del detalle específico
      queryClient.removeQueries({ queryKey: incomeKeys.detail(id) });
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['incomes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', 'summary'] });

      success('Ingreso eliminado', 'El ingreso ha sido eliminado exitosamente');
    },
    onError: (err: any) => {
      showError('Error al eliminar ingreso', err.message || 'No se pudo eliminar el ingreso');
    },
  });
}

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: incomeKeys.monthlySummary(year, month),
    queryFn: () => incomesService.getMonthlySummary(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useYearlySummary(year?: number) {
  return useQuery({
    queryKey: incomeKeys.yearlySummary(year),
    queryFn: () => incomesService.getYearlySummary(year),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useOverallSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: incomeKeys.overallSummary(startDate, endDate),
    queryFn: () => incomesService.getOverallSummary(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}