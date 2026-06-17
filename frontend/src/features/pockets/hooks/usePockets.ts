import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { pocketsService } from '../../../core/api';
import type { CreatePocketDto, UpdatePocketDto, Pocket, TransferDto, DistributionItem } from '../types/pocket.types';
import { useGlobalToast } from '../../../core/hooks/useGlobalToast';

export const pocketKeys = {
  all: ['pockets'] as const,
  lists: () => [...pocketKeys.all, 'list'] as const,
  list: () => [...pocketKeys.lists()] as const,
  details: () => [...pocketKeys.all, 'detail'] as const,
  detail: (id: string) => [...pocketKeys.details(), id] as const,
  summaries: () => [...pocketKeys.all, 'summary'] as const,
  summary: () => [...pocketKeys.summaries()] as const,
};

export function usePockets() {
  return useQuery({
    queryKey: pocketKeys.list(),
    queryFn: () => pocketsService.getAll(),
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function usePocket(id: string) {
  return useQuery({
    queryKey: pocketKeys.detail(id),
    queryFn: () => pocketsService.getById(id),
    enabled: !!id,
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (data: TransferDto) => pocketsService.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pocketKeys.all });
      queryClient.invalidateQueries({ queryKey: pocketKeys.summary() });
      success('Transferencia exitosa', 'El dinero ha sido transferido correctamente');
    },
    onError: (err: Error) => {
      showError('Error al transferir', err.message || 'No se pudo realizar la transferencia');
    },
  });
}


export function useDeleteWithTransfer() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (payload: {
      pocketId: string;
      distributions: DistributionItem[];
      reason: string;
    }) => pocketsService.deleteWithTransfer(payload.pocketId, payload.distributions, payload.reason),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: pocketKeys.all });
      queryClient.invalidateQueries({ queryKey: pocketKeys.list() });
      queryClient.invalidateQueries({ queryKey: pocketKeys.summary() });
      success('Bolsillo eliminado', 'Los fondos han sido transferidos exitosamente');
    },
    onError: (err: Error) => {
      if (err.message?.startsWith('TRANSFER_EXCEEDS_GOAL')) {
        // Extracted by the modal for inline retry — not a generic toast.
        return;
      }
      showError('Error al eliminar', err.message || 'No se pudo eliminar el bolsillo');
    },
  });
}

export function useCreatePocket() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (pocketData: CreatePocketDto) => pocketsService.create(pocketData),
    onSuccess: (newPocket: Pocket) => {
      queryClient.invalidateQueries({ queryKey: ['pockets'] });
      queryClient.invalidateQueries({ queryKey: ['pockets', 'summary'] });

      success('Bolsillo creado', `El bolsillo "${newPocket.name}" ha sido creado exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al crear bolsillo', err.message || 'No se pudo crear el bolsillo');
    },
  });
}

export function useUpdatePocket() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePocketDto }) =>
      pocketsService.update(id, data),
    onSuccess: (updatedPocket: Pocket) => {
      queryClient.setQueryData(pocketKeys.detail(updatedPocket.id), updatedPocket);
      queryClient.invalidateQueries({ queryKey: ['pockets'] });
      queryClient.invalidateQueries({ queryKey: ['pockets', 'summary'] });

      success('Bolsillo actualizado', `El bolsillo "${updatedPocket.name}" ha sido actualizado exitosamente`);
    },
    onError: (err: Error) => {
      showError('Error al actualizar bolsillo', err.message || 'No se pudo actualizar el bolsillo');
    },
  });
}

export function useDeletePocket() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: (id: string) => pocketsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: pocketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['pockets'] });
      queryClient.invalidateQueries({ queryKey: ['pockets', 'summary'] });

      success('Bolsillo eliminado', 'El bolsillo ha sido eliminado exitosamente');
    },
    onError: (err: Error) => {
      showError('Error al eliminar bolsillo', err.message || 'No se pudo eliminar el bolsillo');
    },
  });
}

export function usePocketsSummary() {
  return useQuery({
    queryKey: pocketKeys.summary(),
    queryFn: () => pocketsService.getSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useRegisterDeposit() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useGlobalToast();

  return useMutation({
    mutationFn: ({ pocketId, amount, date, reason, newGoal }: { pocketId: string; amount: number; date: string; reason?: string; newGoal?: number }) =>
      pocketsService.registerDeposit(pocketId, amount, date, reason, newGoal),
    onSuccess: (updatedPocket) => {
      // Invalidar específicamente el pocket detail para asegurar datos frescos
      queryClient.invalidateQueries({ queryKey: pocketKeys.detail(updatedPocket.id) });
      queryClient.invalidateQueries({ queryKey: ['pockets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['pockets', 'summary'] });
      queryClient.invalidateQueries({ queryKey: [...pocketKeys.detail(updatedPocket.id), 'deposits'] });
      const formattedAmount = typeof updatedPocket.accumulatedAmount === 'number'
        ? updatedPocket.accumulatedAmount.toFixed(2)
        : '0.00';
      success('Depósito registrado', `Se han depositado $${formattedAmount} en "${updatedPocket.name}"`);
    },
    onError: (err: Error) => {
      showError('Error al registrar depósito', err.message || 'No se pudo registrar el depósito');
    },
  });
}

export function usePocketDeposits(pocketId: string, offset = 0, limit = 4) {
  return useQuery({
    queryKey: [...pocketKeys.detail(pocketId), 'deposits', { offset, limit }],
    queryFn: () => pocketsService.getDeposits(pocketId, offset, limit),
    enabled: !!pocketId,
  });
}

export function usePocketHistory(pocketId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...pocketKeys.detail(pocketId), 'history'],
    queryFn: ({ pageParam }) => pocketsService.getHistory(pocketId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: !!pocketId,
  });
}
