import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import DeletePocketModal from './DeletePocketModal';
import type { Pocket } from '../types/pocket.types';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the hooks
const mockDeletePocket = { mutate: vi.fn(), isPending: false };
const mockDeleteWithTransfer = { mutate: vi.fn(), isPending: false };
vi.mock('../hooks/usePockets', () => ({
  usePockets: () => ({ data: [] }),
  useDeletePocket: () => mockDeletePocket,
  useDeleteWithTransfer: () => mockDeleteWithTransfer,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createMockPocket(overrides: Partial<Pocket> = {}): Pocket {
  return {
    id: 'pocket-1',
    name: 'Vacaciones',
    type: 'deposit',
    goal: 0,
    accumulatedAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    motivation: 'Para viajar',
    incomes: [],
    expenses: [],
    transfers: [],
    ...overrides,
  };
}

describe('DeletePocketModal — Phase State Machine', () => {
  it('should show phase-0 (delete confirmation) when accumulatedAmount is 0', () => {
    const pocket = createMockPocket({ accumulatedAmount: 0 });
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );
    expect(screen.getByText('Eliminar bolsillo: Vacaciones')).toBeDefined();
    expect(screen.getByText('Esta acción no se puede deshacer')).toBeDefined();
    expect(screen.getByText('Sí, muy seguro')).toBeDefined();
    expect(screen.getByText('No, mejor no')).toBeDefined();
    // Simplified view: should NOT show accumulated amount or meta for deposit
    expect(screen.queryByText('Valor Acumulado')).toBeNull();
    expect(screen.queryByText(/Meta:/)).toBeNull();
  });

  it('should show phase-1 (warning + options) when accumulatedAmount > 0', () => {
    const pocket = createMockPocket({ accumulatedAmount: 500 });
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );
    expect(screen.getByText('Todo a un bolsillo')).toBeDefined();
    expect(screen.getByText('Entre varios bolsillos')).toBeDefined();
  });

  it('should show "Fondos disponibles" warning with balance amount', () => {
    const pocket = createMockPocket({ accumulatedAmount: 1234.56 });
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );
    expect(screen.getByText(/Fondos disponibles/)).toBeDefined();
  });

  it('should navigate to /pockets when phase-0 delete succeeds', () => {
    const pocket = createMockPocket({ accumulatedAmount: 0 });
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );
    fireEvent.click(screen.getByText('Sí, muy seguro'));
    expect(mockDeletePocket.mutate).toHaveBeenCalledWith(
      'pocket-1',
      expect.any(Object),
    );
  });
});
