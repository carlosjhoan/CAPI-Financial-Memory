import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansService } from '../../../core/api';
import type {
  CreateLoanDto,
  UpdateLoanDto,
  LoanFilters,
  Loan,
  LoanOverallSummary,
  LoanPerformance,
} from '../types/loan.types';
import type { PaginatedMeta } from '../../../core/types/base.types';
import { useGlobalToast } from '../../../core/hooks/useGlobalToast';

export const loanKeys = {
  all: ['loans'] as const,
  lists: () => [...loanKeys.all, 'list'] as const,
  list: (filters?: LoanFilters) => [...loanKeys.lists(), { filters }] as const,
  listPaginated: (filters?: LoanFilters, page?: number, limit?: number) =>
    [...loanKeys.lists(), { filters, page, limit }] as const,
  details: () => [...loanKeys.all, 'detail'] as const,
  detail: (id: string) => [...loanKeys.details(), id] as const,
  summaries: () => [...loanKeys.all, 'summary'] as const,
  overallSummary: (startDate?: string, endDate?: string) =>
    [...loanKeys.summaries(), 'overall', { startDate, endDate }] as const,
  monthlySummary: (year?: number, month?: number) =>
    [...loanKeys.summaries(), 'monthly', { year, month }] as const,
  yearlySummary: (year?: number) =>
    [...loanKeys.summaries(), 'yearly', { year }] as const,
  overdue: () => [...loanKeys.summaries(), 'overdue'] as const,
  performance: (id: string) => [...loanKeys.all, 'performance', id] as const,
  payments: () => [...loanKeys.all, 'payments'] as const,
  paymentsList: (loanId: string) => [...loanKeys.payments(), loanId] as const,
};

export function useLoans(filters?: LoanFilters) {
  return useQuery({
    queryKey: loanKeys.list(filters),
    queryFn: () => loansService.getAll(filters),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
  });
}

export function useLoansPaginated(
  filters?: LoanFilters,
  page: number = 1,
  limit: number = 6
) {
  return useQuery<{ data: Loan[]; meta: PaginatedMeta }>({
    queryKey: loanKeys.listPaginated(filters, page, limit),
    queryFn: () => loansService.getAllPaginated(filters, page, limit),
    staleTime: 1000 * 30, // 30 segundos — listas cambian frecuentemente
    placeholderData: (previousData) => previousData,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => loansService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos — detalles rara vez cambian
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (loanData: CreateLoanDto) => loansService.create(loanData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });

      success('Préstamo creado', 'El préstamo ha sido creado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al crear préstamo', err.message || 'No se pudo crear el préstamo');
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoanDto }) =>
      loansService.update(id, data),
    onSuccess: (updatedLoan, variables) => {
      // Actualizar la cache del detalle específico
      queryClient.setQueryData(loanKeys.detail(variables.id), updatedLoan);
      // Invalidar quirúrgicamente — solo listas y summaries
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });

      success('Préstamo actualizado', 'El préstamo ha sido actualizado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al actualizar préstamo', err.message || 'No se pudo actualizar el préstamo');
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => loansService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: loanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });

      success('Préstamo eliminado', 'El préstamo ha sido eliminado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al eliminar préstamo', err.message || 'No se pudo eliminar el préstamo');
    },
  });
}

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ loanId, amount }: { loanId: string; amount: number }) =>
      loansService.registerPayment(loanId, amount),
    onSuccess: (updatedLoan, variables) => {
      queryClient.setQueryData(loanKeys.detail(variables.loanId), updatedLoan);
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'summary'] });

      success('Pago registrado', `Pago de ${variables.amount} registrado exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al registrar pago', err.message || 'No se pudo registrar el pago');
    },
  });
}

export function useOverallSummary(startDate?: string, endDate?: string) {
  return useQuery<LoanOverallSummary>({
    queryKey: loanKeys.overallSummary(startDate, endDate),
    queryFn: () => loansService.getOverallSummary(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: loanKeys.monthlySummary(year, month),
    queryFn: () => loansService.getMonthlySummary(year, month),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useYearlySummary(year?: number) {
  return useQuery({
    queryKey: loanKeys.yearlySummary(year),
    queryFn: () => loansService.getYearlySummary(year),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useLoanPerformance(id: string) {
  return useQuery<LoanPerformance>({
    queryKey: loanKeys.performance(id),
    queryFn: () => loansService.getLoanPerformance(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useOverdueSummary() {
  return useQuery({
    queryKey: loanKeys.overdue(),
    queryFn: () => loansService.getOverdueSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
