import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '../../../core/api';
import { CreateDebtDto, UpdateDebtDto, DebtFilters, Debt, DebtOverallSummary } from '../types/debt.types';
import type { PaginatedMeta } from '../../../core/types/base.types';
import { useGlobalToast } from '../../../core/hooks/useGlobalToast';

export const debtKeys = {
  all: ['debts'] as const,
  lists: () => [...debtKeys.all, 'list'] as const,
  list: (filters?: DebtFilters) => [...debtKeys.lists(), { filters }] as const,
  listPaginated: (filters?: DebtFilters, page?: number, limit?: number) =>
    [...debtKeys.lists(), { filters, page, limit }] as const,
  details: () => [...debtKeys.all, 'detail'] as const,
  detail: (id: string) => [...debtKeys.details(), id] as const,
  summaries: () => [...debtKeys.all, 'summary'] as const,
  summary: () => [...debtKeys.summaries(), 'general'] as const,
  monthlySummary: (year?: number, month?: number) =>
    [...debtKeys.summaries(), 'monthly', { year, month }] as const,
  yearlySummary: (year?: number) =>
    [...debtKeys.summaries(), 'yearly', { year }] as const,
  overallSummary: (startDate?: string, endDate?: string) =>
    [...debtKeys.summaries(), 'overall', { startDate, endDate }] as const,
  payments: () => [...debtKeys.all, 'payments'] as const,
  paymentsList: (debtId: string) => [...debtKeys.payments(), debtId] as const,
};

export function useDebts(filters?: DebtFilters) {
  return useQuery({
    queryKey: debtKeys.list(filters),
    queryFn: () => debtsService.getAll(filters),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
  });
}

export function useDebtsPaginated(
  filters?: DebtFilters,
  page: number = 1,
  limit: number = 6
) {
  return useQuery<{ data: Debt[]; meta: PaginatedMeta }>({
    queryKey: debtKeys.listPaginated(filters, page, limit),
    queryFn: () => debtsService.getAllPaginated(filters, page, limit),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
    placeholderData: (previousData) => previousData,
  });
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: () => debtsService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos — detalles rara vez cambian
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (debtData: CreateDebtDto) => debtsService.create(debtData),
    onSuccess: (newDebt) => {
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'summary'] });

      success('Deuda creada', `La deuda de ${newDebt.lender} ha sido creada exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al crear deuda', err.message || 'No se pudo crear la deuda');
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDebtDto }) =>
      debtsService.update(id, data),
    onSuccess: (updatedDebt, variables) => {
      // Actualizar la cache del detalle específico
      queryClient.setQueryData(debtKeys.detail(variables.id), updatedDebt);
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'summary'] });

      success('Deuda actualizada', 'La deuda ha sido actualizada exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al actualizar deuda', err.message || 'No se pudo actualizar la deuda');
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => debtsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: debtKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'summary'] });

      success('Deuda eliminada', 'La deuda ha sido eliminada exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al eliminar deuda', err.message || 'No se pudo eliminar la deuda');
    },
  });
}

export function useRegisterDebtPayment() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ debtId, amount, date }: { debtId: string; amount: number; date?: string }) =>
      debtsService.registerPayment(debtId, amount, date),
    onSuccess: (updatedDebt, variables) => {
      queryClient.setQueryData(debtKeys.detail(variables.debtId), updatedDebt);
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'summary'] });

      success('Pago registrado', `Pago de $${variables.amount.toFixed(2)} registrado exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al registrar pago', err.message || 'No se pudo registrar el pago');
    },
  });
}

export function useDebtSummary() {
  return useQuery<DebtOverallSummary>({
    queryKey: debtKeys.summary(),
    queryFn: () => debtsService.getSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDebtMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: debtKeys.monthlySummary(year, month),
    queryFn: () => debtsService.getMonthlySummary(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDebtYearlySummary(year?: number) {
  return useQuery({
    queryKey: debtKeys.yearlySummary(year),
    queryFn: () => debtsService.getYearlySummary(year),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDebtOverallSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: debtKeys.overallSummary(startDate, endDate),
    queryFn: () => debtsService.getOverallSummary(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
