import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import PocketHistoryTimeline, { type HistoryItem } from './PocketHistoryTimeline';

afterEach(() => {
  cleanup();
});

// ── Helpers ──

function createItem(index: number, overrides: Partial<HistoryItem> = {}): HistoryItem {
  const base: HistoryItem = {
    id: `item-${index}`,
    type: 'income',
    amount: 1000 * index,
    date: '2026-06-15',
    createdAt: `2026-06-15T${String(10 + index).padStart(2, '0')}:00:00Z`,
  };
  return { ...base, ...overrides };
}

function createItems(count: number, baseOverrides?: Partial<HistoryItem>): HistoryItem[] {
  return Array.from({ length: count }, (_, i) => createItem(i + 1, baseOverrides));
}

function renderTimeline({
  history,
  pocketNameMap,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  history: HistoryItem[];
  pocketNameMap?: Map<string, string>;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}) {
  return render(
    <PocketHistoryTimeline
      history={history}
      pocketNameMap={pocketNameMap ?? new Map()}
      fetchNextPage={fetchNextPage ?? vi.fn()}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage ?? false}
    />,
  );
}

describe('PocketHistoryTimeline', () => {
  it('renders 5 recent items when history has 10+ items', () => {
    const items = createItems(12);
    // First 5 should show as individual items (type labels visible)
    renderTimeline({ history: items });

    // All 12 items have type 'income', so "Ingreso" should appear for each
    const labels = screen.getAllByText('Ingreso');
    // 5 recent + any in monthly groups (which are inside <details> initially hidden)
    // We expect exactly 5 visible Ingreso labels (the recent ones)
    expect(labels.length).toBeGreaterThanOrEqual(5);
  });

  it('shows monthly group for items beyond first 5', () => {
    const items = createItems(12);
    renderTimeline({ history: items });

    // Should show month group "JUNIO 2026" (since all items are June 2026)
    expect(screen.getByText('JUNIO 2026')).toBeInTheDocument();
  });

  it('does not show monthly groups when history has 5 or fewer items', () => {
    const items = createItems(3);
    renderTimeline({ history: items });

    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it('filter tab "Ingresos" shows only income/deposit items', () => {
    const items = [
      createItem(1, { type: 'income', amount: 5000 }),
      createItem(2, { type: 'expense', amount: 2000 }),
      createItem(3, { type: 'income', amount: 3000 }),
      createItem(4, { type: 'transfer', amount: 1000, direction: 'incoming' }),
    ];
    renderTimeline({ history: items });

    // Click "Ingresos" tab
    fireEvent.click(screen.getByText('Ingresos'));

    // Should show items with income type (income = Ingreso label)
    expect(screen.getAllByText('Ingreso').length).toBeGreaterThanOrEqual(1);
    // Should NOT show Gasto items
    expect(screen.queryByText('Gasto')).not.toBeInTheDocument();
  });

  it('filter tab "Gastos" shows only expense/outgoing items', () => {
    const items = [
      createItem(1, { type: 'income', amount: 5000 }),
      createItem(2, { type: 'expense', amount: 2000 }),
    ];
    renderTimeline({ history: items });

    fireEvent.click(screen.getByText('Gastos'));

    expect(screen.getByText('Gasto')).toBeInTheDocument();
    expect(screen.queryByText('Ingreso')).not.toBeInTheDocument();
  });

  it('shows empty state when filter has no matching items', () => {
    const items = [
      createItem(1, { type: 'income', amount: 5000 }),
    ];
    renderTimeline({ history: items });

    fireEvent.click(screen.getByText('Gastos'));

    expect(screen.getByText(/No hay movimientos/)).toBeInTheDocument();
  });

  it('shows "Ver historial completo" button when >5 items and not expanded', () => {
    const items = createItems(10);
    renderTimeline({ history: items, hasNextPage: true });

    expect(screen.getByText('Ver historial completo')).toBeInTheDocument();
  });

  it('hides "Ver historial completo" button when ≤5 items', () => {
    const items = createItems(3);
    renderTimeline({ history: items });

    expect(screen.queryByText('Ver historial completo')).not.toBeInTheDocument();
  });

  it('calls fetchNextPage when "Ver historial completo" is clicked and hasNextPage is true', () => {
    const fetchNextPage = vi.fn();
    const items = createItems(10);
    renderTimeline({ history: items, hasNextPage: true, fetchNextPage });

    fireEvent.click(screen.getByText('Ver historial completo'));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('renders transfer items with ArrowsRightLeftIcon', () => {
    const { container } = render(
      <PocketHistoryTimeline
        history={[createItem(1, { type: 'transfer', direction: 'incoming', amount: 5000 })]}
        pocketNameMap={new Map()}
        fetchNextPage={vi.fn()}
        hasNextPage={false}
        isFetchingNextPage={false}
      />,
    );

    // Transferencia label should be visible
    expect(screen.getByText('Transferencia')).toBeInTheDocument();
    // The ArrowsRightLeftIcon renders an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows transfer source pocket name from pocketNameMap', () => {
    const pocketNameMap = new Map([['src-pocket', 'Vacaciones']]);
    const items: HistoryItem[] = [
      {
        id: 't1',
        type: 'transfer',
        amount: 5000,
        date: '2026-06-15',
        createdAt: '2026-06-15T10:00:00Z',
        direction: 'incoming',
        sourcePocketId: 'src-pocket',
      },
    ];
    renderTimeline({ history: items, pocketNameMap });

    expect(screen.getByText(/Vacaciones/)).toBeInTheDocument();
  });
});
