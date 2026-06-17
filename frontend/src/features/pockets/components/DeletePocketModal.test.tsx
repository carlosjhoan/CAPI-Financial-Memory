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
    initialAmount: 0,
    accumulatedAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    motivation: 'Para viajar',
    deposits: [],
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
    expect(screen.getByText('Eliminar Bolsillo')).toBeDefined();
    expect(screen.getByText('Esta acción no se puede deshacer')).toBeDefined();
    expect(screen.getByText('Eliminar')).toBeDefined();
  });

  it('should show phase-1 (warning + options) when accumulatedAmount > 0', () => {
    const pocket = createMockPocket({ accumulatedAmount: 500 });
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );
    expect(screen.getByText('Transferir antes de eliminar')).toBeDefined();
    expect(screen.getByText('Transferir todo a un bolsillo')).toBeDefined();
    expect(screen.getByText('Dividir entre varios bolsillos')).toBeDefined();
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
    fireEvent.click(screen.getByText('Eliminar'));
    expect(mockDeletePocket.mutate).toHaveBeenCalledWith(
      'pocket-1',
      expect.any(Object),
    );
  });
});
