import type { FinancialEntity, EntityConfig, SectionReturn } from '../../../../core/types/financial-entity.types';
import type { TimelineConfig } from '../../EntityFinancialSection';
import EntityFinancialSection from '../../EntityFinancialSection';
import SplitPanelLayout from '../../SplitPanelLayout';
import RecordFocusCard from '../../RecordFocusCard';
import { formatCurrency } from '../../../../core/utils/format';

// ==========================================
// TYPES
// ==========================================

interface HistoriaTabProps<T extends FinancialEntity> {
  config: EntityConfig<T>;
  sectionProps: SectionReturn<T>;
  timelineItems: T[];
  timelineConfig?: TimelineConfig<T>;
  focusedItem: T | null;
  onFocusItem: (item: T | null) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  dateRangeContext?: { startDate: string; endDate: string };
}

// ==========================================
// COMPONENT
// ==========================================

function HistoriaTab<T extends FinancialEntity>({
  config,
  sectionProps,
  timelineItems,
  timelineConfig,
  focusedItem,
  onFocusItem,
  onEdit,
  onDelete,
  dateRangeContext,
}: HistoriaTabProps<T>) {
  return (
    <div className="relative">
      <SplitPanelLayout
        left={
          <EntityFinancialSection
            {...sectionProps}
            items={timelineItems}
            dateRangeContext={dateRangeContext}
            timeline={timelineConfig}
            hideHero
          />
        }
        right={
          focusedItem ? (
            <div className="p-4">
              <RecordFocusCard
                item={focusedItem}
                renderDetail={(item: T) => (
                  <div>
                    <div
                      className={`h-0.5 ${config.colors.dividerColor}`}
                    />
                    <div className="p-4 space-y-2">
                      <p className="text-base font-semibold text-secondary-900 dark:text-white">
                        {item.reason}
                      </p>
                      <p
                        className={`text-2xl font-bold ${config.colors.amountText}`}
                      >
                        {config.amountSign}
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-sm text-secondary-400 dark:text-secondary-500">
                        {item.date}
                      </p>
                      <div className="flex gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
                        <button
                          onClick={() => onEdit(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/40 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Ajustar
                        </button>
                        <button
                          onClick={() => {
                            onDelete(item);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                monthName={
                  timelineConfig?.currentMonth?.monthName ?? ''
                }
                year={
                  timelineConfig?.currentMonth?.year ??
                  new Date().getFullYear()
                }
              />
            </div>
          ) : null
        }
        showRightOnMobile={!!focusedItem}
        onMobileDismiss={() => onFocusItem(null)}
      />
    </div>
  );
}

export default HistoriaTab;
