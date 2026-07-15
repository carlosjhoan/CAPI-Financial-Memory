import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FilterProvider } from '../../../core/contexts/FilterContext';
import type { Expense } from '../types/expense.types';
import ExpensesPage from './ExpensesPage';

// Mock browser APIs used by TimelineFeed (rendered via ExpenseList → EntityFinancialSection → TimelineFeed)
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
  class MockIntersectionObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
    takeRecords(): IntersectionObserverEntry[] { return []; }
    root: Element | null = null;
    rootMargin = '';
    thresholds: number[] = [];
  }
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: MockIntersectionObserver });
  class MockResizeObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: MockResizeObserver });
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../../core/hooks/useGlobalToast', () => ({
  useGlobalToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({ data: [], isLoading: false }),
  useExpensesPaginated: () => ({ data: { data: [], meta: { total: 0, page: 1, limit: 6, totalPages: 0 } }, isLoading: false }),
  useCreateExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMonthlySummary: () => ({ data: null }),
  useYearlySummary: () => ({ data: null }),
  useOverallSummary: () => ({ data: null }),
}));

const stableUseExpenseSection = vi.hoisted(() => {
  const stableItems: Expense[] = [];
  return {
    useExpenseSection: () => ({
      items: stableItems,
      paginationMeta: { total: 0, page: 1, limit: 6, totalPages: 0 },
      error: null, viewMode: 'all' as const,
      card: { renderCard: () => null, getKey: (e: Expense) => e.id, accentColor: 'orange' as const },
      summary: { monthly: null, yearly: null, overall: null },
      monthlyBreakdown: { selectedMonth: null, onMonthSelect: () => {}, selectedItems: stableItems, onSelectedPageChange: () => {} },
      onPageChange: () => {},
      layout: { accentColor: 'orange' as const, sectionName: 'Gastos', title: '', totalLabel: 'Total:', emptyMessage: 'No hay gastos', emptyActionLabel: 'Crear Primer Gasto', createButtonLabel: 'Nuevo', gridColumns: 3, emptyIcon: null },
      timelineNavigation: { availableMonths: [] as string[], currentMonthIndex: 0, currentMonth: null, goToNextMonth: () => {}, transitioning: false, monthItems: stableItems },
    }),
  };
});

vi.mock('../../../core/hooks/useExpenseSection', () => stableUseExpenseSection);

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FilterProvider>
          <ExpensesPage />
        </FilterProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExpensesPage', () => {
  beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
  afterEach(cleanup);

  it('should render Gestión tab by default', () => {
    const { container } = renderPage();
    const activeTab = container.querySelector('.border-orange-500');
    expect(activeTab).toBeTruthy();
    expect(activeTab?.textContent).toContain('Gestión');
  });

  it('should render both tab buttons', () => {
    renderPage();
    expect(screen.getByText('Historia')).toBeInTheDocument();
    expect(screen.getByText('Gestión')).toBeInTheDocument();
  });

  it('should render FloatingActionButton for Gestión tab', () => {
    renderPage();
    expect(screen.getByLabelText('Nuevo Gasto')).toBeInTheDocument();
  });
});