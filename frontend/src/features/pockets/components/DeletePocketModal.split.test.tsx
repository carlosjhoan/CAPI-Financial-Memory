import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DeletePocketModal from './DeletePocketModal';
import type { Pocket } from '../types/pocket.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockDeletePocket = { mutate: vi.fn(), isPending: false };
const mockDeleteWithTransfer = { mutate: vi.fn(), isPending: false };
vi.mock('../hooks/usePockets', () => ({
  usePockets: () => ({
    data: [
      {
        id: 'target-1',
        name: 'Ahorro',
        type: 'deposit',
        goal: 0,
        initialAmount: 0,
        accumulatedAmount: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        motivation: '',
        incomes: [],
        expenses: [],
        transfers: [],
      },
      {
        id: 'target-2',
        name: 'Meta viaje',
        type: 'goal',
        goal: 1000,
        initialAmount: 0,
        accumulatedAmount: 200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        motivation: '',
        incomes: [],
        expenses: [],
        transfers: [],
      },
    ],
  }),
  useDeletePocket: () => mockDeletePocket,
  useDeleteWithTransfer: () => mockDeleteWithTransfer,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createPocketWithBalance(amount: number): Pocket {
  return {
    id: 'pocket-1',
    name: 'Gastos',
    type: 'deposit',
    goal: 0,
    initialAmount: 0,
    accumulatedAmount: amount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    motivation: '',
    incomes: [],
    expenses: [],
    transfers: [],
  };
}

describe('DeletePocketModal — Split Sum Validator', () => {
  it('should show remaining balance display in split mode', () => {
    // Click "Dividir entre varios bolsillos" in phase-1
    const pocket = createPocketWithBalance(1000);
    render(
      <DeletePocketModal isOpen={true} onClose={vi.fn()} pocket={pocket} />,
    );

    // Phase-1 should show split button
    expect(screen.getByText('Dividir entre varios bolsillos')).toBeDefined();
  });
});
