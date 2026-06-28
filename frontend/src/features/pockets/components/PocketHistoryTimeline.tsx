import React, { useState, useMemo } from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../core/utils/format';

export type HistoryItem = {
  id: string;
  type: string;
  amount: number;
  date: string;
  createdAt?: string;
  direction?: 'incoming' | 'outgoing';
  sourcePocketId?: string;
  targetPocketId?: string;
  reason?: string;
  description?: string;
};

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

interface PocketHistoryTimelineProps {
  history: HistoryItem[];
  pocketNameMap: Map<string, string>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

const MONTHS_SPANISH = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

function getMonthYearKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS_SPANISH[d.getMonth()]} ${d.getFullYear()}`;
}

function getLabel(type: string): string {
  const labels: Record<string, string> = {
    income: 'Ingreso',
    deposit: 'Depósito',
    expense: 'Gasto',
    transfer: 'Transferencia',

  };
  return labels[type] || 'Movimiento';
}

function getMovementColor(item: HistoryItem): string {
  if (item.type === 'transfer') {
    return item.direction === 'incoming' ? 'text-green-500' : 'text-red-500';
  }
  if (item.type === 'deposit' || item.type === 'income') return 'text-green-500';
  return 'text-red-500';
}

function getMovementSign(item: HistoryItem): string {
  if (item.type === 'transfer') {
    return item.direction === 'incoming' ? '+' : '-';
  }
  if (item.type === 'deposit' || item.type === 'income') return '+';
  return '-';
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  if (isSameDay(d, today)) return 'HOY';
  if (isYesterday(d)) return 'AYER';
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${day} ${month}`;
}

function formatTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function matchesFilter(item: HistoryItem, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'income') return item.type === 'income' || item.type === 'deposit';
  if (filter === 'expense') return item.type === 'expense';
  if (filter === 'transfer') return item.type === 'transfer';
  return true;
}

const HistoryRow: React.FC<{ item: HistoryItem; pocketNameMap: Map<string, string> }> = ({
  item,
  pocketNameMap,
}) => {
  const color = getMovementColor(item);
  return (
    <div className="flex items-start justify-between text-sm py-2">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 ${color} flex-shrink-0 flex items-center justify-center`}
        >
          {item.type === 'transfer' ? (
            <ArrowsRightLeftIcon className="w-4 h-4" />
          ) : (
            <span className="font-bold text-base leading-none">
              {item.type === 'deposit' || item.type === 'income' ? '↑' : '↓'}
            </span>
          )}
        </span>
        <div>
          <span className={`font-bold ${color}`}>{getLabel(item.type)}</span>
          <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">
            {formatDateLabel(item.date)}{item.createdAt ? ` · ${formatTime(item.createdAt)}` : ''}
          </div>
          <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-1.5">
            {item.type === 'transfer' && item.direction === 'incoming' && item.sourcePocketId
              ? `Procedente de ${pocketNameMap.get(item.sourcePocketId) || item.sourcePocketId.slice(0, 8)}`
              : item.type === 'transfer' && item.direction === 'outgoing' && item.targetPocketId
                ? `Hacia ${pocketNameMap.get(item.targetPocketId) || item.targetPocketId.slice(0, 8)}`
                : item.reason || ''}
          </p>
        </div>
      </div>
      <span className={`font-bold text-sm text-right tabular-nums ${color}`}>
        {getMovementSign(item)}
        {formatCurrency(item.amount)}
      </span>
    </div>
  );
};

const PocketHistoryTimeline: React.FC<PocketHistoryTimelineProps> = ({
  history,
  pocketNameMap,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (monthYear: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthYear)) next.delete(monthYear);
      else next.add(monthYear);
      return next;
    });
  };

  const filteredHistory = useMemo(
    () => history.filter((item) => matchesFilter(item, filter)),
    [history, filter],
  );

  const recentItems = filteredHistory.slice(0, 5);
  const olderItems = filteredHistory.slice(5);

  const monthlyGroups = useMemo(() => {
    const groups = new Map<string, HistoryItem[]>();
    for (const item of olderItems) {
      const key = getMonthYearKey(item.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [olderItems]);

  const VISIBLE_MONTHS = 6;

  const [showAllMonths, setShowAllMonths] = useState(false);

  const isEmpty = filteredHistory.length === 0;
  const showFullHistory = hasNextPage && history.length > 5;

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'income', label: 'Ingresos' },
    { key: 'expense', label: 'Gastos' },
    { key: 'transfer', label: 'Transferencias' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-4 mb-4 border-b border-secondary-200 dark:border-secondary-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              filter === tab.key
                ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-secondary-500 dark:text-secondary-400 border-transparent hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <p className="text-secondary-500 dark:text-secondary-400 text-sm py-4">
          No hay movimientos
        </p>
      ) : (
        <>
          {/* Recent items (first 5) */}
          <div className="text-[11px] font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500 py-2 border-b border-secondary-100 dark:border-secondary-700/50">
            RECIENTES
          </div>
          <div>
            {recentItems.map((item) => (
              <HistoryRow key={item.id} item={item} pocketNameMap={pocketNameMap} />
            ))}
          </div>

          {/* Monthly groups for older items */}
          {(showAllMonths ? monthlyGroups : monthlyGroups.slice(0, VISIBLE_MONTHS)).map(([monthYear, items]) => {
            const totalIn = items
              .filter((i) => i.type === 'income' || i.type === 'deposit')
              .reduce((sum, i) => sum + i.amount, 0);
            const totalOut = items
              .filter((i) => i.type === 'expense')
              .reduce((sum, i) => sum + i.amount, 0);
            const totalTransfers = items
              .filter((i) => i.type === 'transfer')
              .reduce((sum, i) => sum + i.amount, 0);
            return (
              <div key={monthYear}>
                <button
                  onClick={() => toggleMonth(monthYear)}
                  className="flex items-center gap-2 w-full text-left text-[11px] font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500 cursor-pointer py-2 mt-2 border-b border-secondary-100 dark:border-secondary-700/50 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                >
                  <svg
                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-300 ${
                      expandedMonths.has(monthYear) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{monthYear}</span>
                  <span className="text-secondary-400 dark:text-secondary-500 flex-shrink-0">·</span>
                  <span className="flex items-center gap-1.5">
                    {totalIn > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-semibold text-green-700 dark:text-green-400 not-uppercase tracking-normal leading-none">
                        ↑{formatCurrency(totalIn)}
                      </span>
                    )}
                    {totalOut > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-[10px] font-semibold text-red-700 dark:text-red-400 not-uppercase tracking-normal leading-none">
                        ↓{formatCurrency(totalOut)}
                      </span>
                    )}
                    {totalTransfers > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-semibold text-blue-700 dark:text-blue-400 not-uppercase tracking-normal leading-none">
                        ↔{formatCurrency(totalTransfers)}
                      </span>
                    )}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-[10px] font-semibold text-purple-700 dark:text-purple-400 not-uppercase tracking-normal leading-none">
                      {items.length} movs
                    </span>
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: expandedMonths.has(monthYear) ? '2000px' : '0' }}
                >
                  <div className="mt-1">
                    {items.map((item) => (
                      <HistoryRow key={item.id} item={item} pocketNameMap={pocketNameMap} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ver más meses */}
          {monthlyGroups.length > VISIBLE_MONTHS && !showAllMonths && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllMonths(true)}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                Ver {monthlyGroups.length - VISIBLE_MONTHS} meses anteriores
              </button>
            </div>
          )}

          {/* "Ver historial completo" button */}
          {showFullHistory && (
            <div className="flex justify-center mt-6">
              <button
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? 'Cargando...' : 'Ver historial completo'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PocketHistoryTimeline;
