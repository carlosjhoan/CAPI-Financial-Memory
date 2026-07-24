import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { FinancialEntity, EntityConfig, SectionReturn } from '../../../../core/types/financial-entity.types';
import type { SessionFilterType } from '../../SessionFilters';
import FloatingActionButton from '../../FloatingActionButton';
import FloatingFilterToggle from '../../FloatingFilterToggle';
import GlassCard from '../../GlassCard';
import KebabPopover from '../../KebabPopover';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  formatCurrency,
  formatCreatedAtDateLabel,
  formatTime,
  getMonthYearKey,
  localDateStr,
} from '../../../../core/utils/format';

// ==========================================
// TYPES
// ==========================================

/**
 * Para items ajustados, devuelve el createdAt del ajuste más reciente.
 * Para items sin ajustes, devuelve el createdAt original.
 */
function getDisplayCreatedAt(item: FinancialEntity): string {
  if (item.netAmount == null || item.netAmount === item.amount) return item.createdAt;
  const adjustments = (item as any).adjustments as { createdAt?: string }[] | undefined;
  if (!adjustments?.length) return item.createdAt;
  return adjustments.reduce(
    (latest, adj) => (adj.createdAt && adj.createdAt > latest ? adj.createdAt : latest),
    item.createdAt,
  );
}

interface GestionTabProps<T extends FinancialEntity> {
  config: EntityConfig<T>;
  sectionProps: SectionReturn<T>;
  filterType: SessionFilterType;
  isFilterOpen: boolean;
  onFilterChange: (
    type: SessionFilterType,
    range?: { startDate: string; endDate: string },
    year?: number,
    month?: number,
  ) => void;
  onIsFilterOpenChange: (open: boolean) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onBreakdown: (item: T) => void;
  onCreate: () => void;
}

// ==========================================
// COMPONENT
// ==========================================

function GestionTab<T extends FinancialEntity>({
  config,
  sectionProps,
  filterType,
  isFilterOpen,
  onFilterChange,
  onIsFilterOpenChange,
  onEdit,
  onDelete,
  onBreakdown,
  onCreate,
}: GestionTabProps<T>) {
  // ── Gestión: accumulated items with month grouping ──
  const gestionItems = sectionProps.items;

  const justLoadedMoreRef = useRef(false);
  const [accumulatedItems, setAccumulatedItems] =
    useState<T[]>(gestionItems);

  const handleLoadMore = useCallback(() => {
    justLoadedMoreRef.current = true;
    sectionProps.onPageChange(
      (sectionProps.paginationMeta?.page ?? 1) + 1,
    );
  }, [sectionProps]);

  useEffect(() => {
    if (justLoadedMoreRef.current) {
      justLoadedMoreRef.current = false;
      setAccumulatedItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const fresh = gestionItems.filter(
          (i) => !existingIds.has(i.id),
        );
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    } else {
      setAccumulatedItems(gestionItems);
    }
  }, [gestionItems]);

  // Reset accumulation on filter change only
  useEffect(() => {
    justLoadedMoreRef.current = false;
    setAccumulatedItems(gestionItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, T[]>();
    for (const item of accumulatedItems) {
      const key = getMonthYearKey(item.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [accumulatedItems]);

  // All months expanded by default
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );
  const toggleMonth = useCallback((monthYear: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthYear)) next.delete(monthYear);
      else next.add(monthYear);
      return next;
    });
  }, []);

  const hasMore =
    (config.showLoadMore !== false) &&
    (sectionProps.paginationMeta?.totalPages ?? 1) >
      (sectionProps.paginationMeta?.page ?? 1);

  return (
    <div className="relative">
      {/* Floating buttons */}
      <div className="relative">
        <FloatingFilterToggle
          onFilterChange={onFilterChange}
          defaultFilter={filterType}
          accentColor={config.filterAccent}
          onIsOpenChange={onIsFilterOpenChange}
        />
        {!isFilterOpen && (
          <FloatingActionButton
            onClick={onCreate}
            label={config.labels.fabLabel}
            accentColor={config.filterAccent}
          />
        )}
      </div>

      {/* Grouped cards with load more */}
      {accumulatedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary-400 dark:text-secondary-500">
            {config.labels.emptyMessage}
          </p>
          <button
            onClick={onCreate}
            className={`mt-2 text-sm font-medium ${config.colors.linkColor} hover:underline`}
          >
            {config.labels.emptyActionLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {monthGroups.map(([monthYear, items]) => {
            const groupTotal = items.reduce(
              (sum, i) => sum + (i.netAmount ?? i.amount),
              0,
            );
            const isCollapsed =
              collapsedMonths.has(monthYear);
            return (
              <div key={monthYear}>
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(monthYear)}
                  className="flex items-center gap-2 w-full text-left text-xs font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500 py-2 border-b border-secondary-200 dark:border-secondary-700/50 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span>{monthYear}</span>
                  <span className="text-secondary-400 dark:text-secondary-500">
                    ·
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${config.colors.badgeBg} text-[10px] font-semibold ${config.colors.badgeText} not-uppercase tracking-normal leading-none`}
                  >
                    {config.amountSign}
                    {formatCurrency(groupTotal)}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-[10px] font-semibold text-secondary-500 dark:text-secondary-400 not-uppercase tracking-normal leading-none">
                    {items.length}{' '}
                    {items.length === 1
                      ? config.labels.entitySingular
                      : config.labels.entityPlural}
                  </span>
                </button>

                {/* Month items */}
                {!isCollapsed && (
                  <div className="mt-3 space-y-2">
                    {items.map((item) => {
                      const displayCreatedAt = getDisplayCreatedAt(item);
                      const isAdjusted = item.netAmount != null && item.netAmount !== item.amount;
                      const hasDeletedPocket =
                        !item.allocations?.length ||
                        item.allocations.some((a) => a.pocketId == null);
                      return (
                      <GlassCard
                        key={item.id}
                        accentColor={config.colors.accentRGB}
                      >
                        <div className="flex items-center gap-3">
                          {/* Day — HOY/AYER + day number or just day */}
                          <div className="flex flex-col items-center min-w-[40px]">
                            {(() => {
                              const datePart = item.date;
                              const today = localDateStr();
                              const yesterdayDate = new Date();
                              yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                              const yesterday = localDateStr(yesterdayDate);
                              const dayNum = item.date.split('-')[2];

                              if (datePart === today) {
                                return (
                                  <>
                                    <span className="text-[10px] font-bold text-secondary-500 dark:text-secondary-400 leading-tight uppercase">HOY</span>
                                    <span className="text-lg font-bold text-secondary-900 dark:text-white leading-none mt-0.5">{dayNum}</span>
                                  </>
                                );
                              }
                              if (datePart === yesterday) {
                                return (
                                  <>
                                    <span className="text-[10px] font-bold text-secondary-500 dark:text-secondary-400 leading-tight uppercase">AYER</span>
                                    <span className="text-lg font-bold text-secondary-900 dark:text-white leading-none mt-0.5">{dayNum}</span>
                                  </>
                                );
                              }
                              return (
                                <span className="text-lg font-bold text-secondary-900 dark:text-white leading-none">
                                  {dayNum}
                                </span>
                              );
                            })()}
                          </div>
                          {/* Separator */}
                          <div className="w-px h-10 bg-secondary-200 dark:bg-secondary-700" />
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                              {item.reason}
                            </p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-secondary-400 dark:text-secondary-500 truncate">
                                {item.allocations &&
                                item.allocations.length > 0
                                  ? `${item.allocations.map((a) => a.pocketName).join(' | ')}`
                                  : 'Bolsillo eliminado'}
                              </p>
                              {item.allocations &&
                                item.allocations.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onBreakdown(item)
                                    }
                                    className={`shrink-0 p-0.5 rounded text-secondary-400 ${config.colors.iconHover} transition-colors`}
                                    aria-label="Ver detalle por bolsillo"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  </button>
                                )}
                            </div>
                          </div>
                          {/* Amount + createdAt */}
                          <div className="flex flex-col items-end shrink-0">
                            <span
                              className={`text-sm font-semibold ${config.colors.amountText}`}
                            >
                              {config.amountSign}
                              {formatCurrency(item.netAmount ?? item.amount)}
                            </span>
                            <span className="text-[10px] text-secondary-400 dark:text-secondary-500 leading-none mt-0.5 whitespace-nowrap">
                              creado {formatCreatedAtDateLabel(item.createdAt)} {formatTime(item.createdAt)}
                            </span>
                            {isAdjusted && (
                              <span className="text-[9px] text-secondary-400 dark:text-secondary-500 leading-none mt-0.5 whitespace-nowrap">
                                Ajustado {formatCreatedAtDateLabel(displayCreatedAt)} {formatTime(displayCreatedAt)}
                              </span>
                            )}
                          </div>
                          {/* Kebab o candado según el estado del registro */}
                          {hasDeletedPocket ? (
                            <span
                              className="p-1.5 rounded-lg text-secondary-300 dark:text-secondary-600 cursor-default"
                              title="Registro histórico vinculado a un bolsillo eliminado"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            </span>
                          ) : (
                            <KebabPopover
                              actions={[
                                {
                                  label: 'Ajustar',
                                  icon: <PencilIcon className="w-4 h-4" />,
                                  onClick: () =>
                                    onEdit(item),
                                },
                                {
                                  label: 'Eliminar',
                                  icon: <TrashIcon className="w-4 h-4" />,
                                  danger: true,
                                  onClick: () => {
                                    onDelete(item);
                                  },
                                },
                              ]}
                            />
                          )}
                        </div>
                      </GlassCard>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ver más registros */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={handleLoadMore}
                className={`text-sm font-medium ${config.colors.linkColor} hover:opacity-80 transition-opacity`}
              >
                Ver más registros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GestionTab;
