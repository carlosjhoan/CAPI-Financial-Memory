import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock pocketsService
vi.mock('../../../core/api', () => ({
  pocketsService: {
    deleteWithTransfer: vi.fn(),
  },
}));

// Mock useGlobalToast
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../../../core/hooks/useGlobalToast', () => ({
  useGlobalToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

import { useDeleteWithTransfer } from './usePockets';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('useDeleteWithTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a mutation function', () => {
    const { result } = renderHook(() => useDeleteWithTransfer(), {
      wrapper: createWrapper(),
    });
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('should call api with correct parameters on mutate', async () => {
    const { pocketsService } = await import('../../../core/api');
    (pocketsService.deleteWithTransfer as jest.Mock).mockResolvedValue({
      deletedPocketId: 'pocket-1',
    });

    const { result } = renderHook(() => useDeleteWithTransfer(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      pocketId: 'pocket-1',
      distributions: [{ targetPocketId: 'target-1', amount: 500 }],
      reason: 'Closing pocket',
    });

    await waitFor(() => {
      expect(pocketsService.deleteWithTransfer).toHaveBeenCalledWith(
        'pocket-1',
        [{ targetPocketId: 'target-1', amount: 500 }],
        'Closing pocket',
      );
    });
  });
});
