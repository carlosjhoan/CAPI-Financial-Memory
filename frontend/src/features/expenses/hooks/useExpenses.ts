import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../../../core/api';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilters, PaginatedMeta, Expense } from '../types/expense.types';
import { useGlobalToast } from '../../../core/hooks/useGlobalToast';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.lists(), { filters }] as const,
  listPaginated: (filters?: ExpenseFilters, page?: number, limit?: number) => [...expenseKeys.lists(), { filters, page, limit }] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  summaries: () => [...expenseKeys.all, 'summary'] as const,
  monthlySummary: (year?: number, month?: number) => [...expenseKeys.summaries(), 'monthly', { year, month }] as const,
  yearlySummary: (year?: number) => [...expenseKeys.summaries(), 'yearly', { year }] as const,
  overallSummary: (startDate?: string, endDate?: string) =>
    [...expenseKeys.summaries(), 'overall', { startDate, endDate }] as const,
};

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expensesService.getAll(filters),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
  });
}

export function useExpensesPaginated(filters?: ExpenseFilters, page: number = 1, limit: number = 6) {
  return useQuery<{ data: Expense[]; meta: PaginatedMeta }>({
    queryKey: expenseKeys.listPaginated(filters, page, limit),
    queryFn: () => expensesService.getAllPaginated(filters, page, limit),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
    placeholderData: (previousData) => previousData,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos — detalles rara vez cambian
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (expenseData: CreateExpenseDto) => expensesService.create(expenseData),
    onSuccess: (newExpense) => {
      // Invalidar quirúrgicamente — solo listas y summaries (no detalles individuales)
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      // Los gastos con allocations afectan bolsillos — refrescar diagramas
      queryClient.invalidateQueries({ queryKey: ['pockets'] });

      success('Gasto creado', `El gasto de $${newExpense.amount.toFixed(2)} ha sido creado exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al crear gasto', err.message || 'No se pudo crear el gasto');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expensesService.update(id, data),
    onSuccess: (updatedExpense, variables) => {
      // Actualizar la cache del detalle específico
      queryClient.setQueryData(expenseKeys.detail(variables.id), updatedExpense);
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      // Las allocations actualizadas afectan bolsillos — refrescar diagramas
      queryClient.invalidateQueries({ queryKey: ['pockets'] });

      success('Gasto actualizado', 'El gasto ha sido actualizado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al actualizar gasto', err.message || 'No se pudo actualizar el gasto');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: (_, id) => {
      // Remover la cache del detalle específico
      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      // Eliminar un gasto con allocations afecta bolsillos — refrescar diagramas
      queryClient.invalidateQueries({ queryKey: ['pockets'] });

      success('Gasto eliminado', 'El gasto ha sido eliminado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al eliminar gasto', err.message || 'No se pudo eliminar el gasto');
    },
  });
}

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expensesService.getMonthlySummary(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useYearlySummary(year?: number) {
  return useQuery({
    queryKey: expenseKeys.yearlySummary(year),
    queryFn: () => expensesService.getYearlySummary(year),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useOverallSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: expenseKeys.overallSummary(startDate, endDate),
    queryFn: () => expensesService.getOverallSummary(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
