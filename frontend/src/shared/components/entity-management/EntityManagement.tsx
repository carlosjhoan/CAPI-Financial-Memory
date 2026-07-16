import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FinancialEntity, EntityConfig, GoalExceededState, CreateEntityDto, UpdateEntityDto } from '../../../core/types/financial-entity.types';
import type { TimelineConfig } from '../EntityFinancialSection';
import { SessionFilterType } from '../SessionFilters';
import Modal from '../Modal';
import PageGradient from '../PageGradient';
import AllocationBreakdownModal from '../AllocationBreakdownModal';
import { GestionTab, HistoriaTab } from './tabs';
import { useFilterContext } from '../../../core/contexts';
import { useTheme } from '../../../core/hooks/useTheme';
import { formatCurrency } from '../../../core/utils/format';

// ==========================================
// TYPES
// ==========================================

type Tab = 'historia' | 'gestion';

export interface EntityManagementProps<T extends FinancialEntity> {
  config: EntityConfig<T>;
}

// ==========================================
// COMPONENT
// ==========================================

function EntityManagement<T extends FinancialEntity>({
  config,
}: EntityManagementProps<T>) {
  const [searchParams] = useSearchParams();
  const pocketId = searchParams.get('pocketId');
  const {
    filterType,
    debouncedFilters,
    updateFilters,
    clearFilters,
    setFilterType,
    setSelectedYear,
    setSelectedMonth,
  } = useFilterContext();

  const [tab, setTab] = useState<Tab>('gestion');
  const [focusedItem, setFocusedItem] = useState<T | null>(null);

  // Animation gate
  const [animated] = useState(
    () => !sessionStorage.getItem(config.animationKey),
  );
  const markAnimated = useCallback(() => {
    if (!sessionStorage.getItem(config.animationKey)) {
      sessionStorage.setItem(config.animationKey, 'true');
    }
  }, [config.animationKey]);

  const handleTabChange = useCallback(
    (newTab: Tab) => {
      setTab(newTab);
      if (newTab === 'historia') markAnimated();
      if (newTab !== 'historia') setFocusedItem(null);
    },
    [markAnimated],
  );

  // ── Modal state ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemForBreakdown, setItemForBreakdown] = useState<T | null>(null);
  const [goalExceeded, setGoalExceeded] =
    useState<GoalExceededState<T> | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── Mutations ──
  const createMutation = config.hooks.useCreate();
  const updateMutation = config.hooks.useUpdate();
  const deleteMutation = config.hooks.useDelete();

  // Open create modal when pocketId is in URL
  useEffect(() => {
    if (config.hasPocketFilter && pocketId) setIsCreateModalOpen(true);
  }, [config.hasPocketFilter, pocketId]);

  // ── Section hook (Historia tab + data source) ──
  const sectionProps = config.hooks.useSection({
    filters: debouncedFilters,
    filterType,
    card: {
      renderCard: () => null,
      getKey: (item: T) => item.id,
      accentColor: config.filterAccent,
    },
  });

  const timelineItems =
    sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;

  const timelineConfig: TimelineConfig<T> | undefined = useMemo(() => {
    if (!sectionProps.timelineNavigation) return undefined;
    return {
      renderRow: (item: T) => (
        <div className="flex items-center justify-between min-w-0 gap-3">
          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate min-w-0">
            {item.reason}
          </p>
          <span
            className={`text-sm font-semibold ${config.colors.amountText} shrink-0`}
          >
            {config.amountSign}
            {formatCurrency(item.amount)}
          </span>
        </div>
      ),
      renderPocket: (item: T) => {
        if (!item.allocations || item.allocations.length === 0)
          return 'sin bolsillo';
        return item.allocations.length === 1
          ? item.allocations[0].pocketName
          : `${item.allocations[0].pocketName} y ${item.allocations.length - 1} más`;
      },
      getDate: (item: T) => item.date,
      getStatusDot: () => config.colors.statusDot,
      currentMonth: sectionProps.timelineNavigation.currentMonth,
      onMonthEnd: sectionProps.timelineNavigation.goToNextMonth,
      transitioning: sectionProps.timelineNavigation.transitioning,
      variant: 'inline',
      animated,
      onFocusItemClick: (item: T) => setFocusedItem(item),
    };
  }, [sectionProps.timelineNavigation, animated, config]);

  // ── Session filter handler ──
  const handleSessionFilterChange = useCallback(
    (
      type: SessionFilterType,
      range?: { startDate: string; endDate: string },
      year?: number,
      month?: number,
    ) => {
      setFilterType(type);
      if (type === 'all') clearFilters();
      else if (type === 'dateRange' && range)
        updateFilters({
          startDate: range.startDate,
          endDate: range.endDate,
        });
      else if (type === 'yearly' && year) {
        setSelectedYear(year);
        updateFilters({ year });
      } else if (type === 'monthly' && year && month) {
        setSelectedYear(year);
        setSelectedMonth(month);
        updateFilters({ year, month });
      }
    },
    [
      setFilterType,
      clearFilters,
      updateFilters,
      setSelectedYear,
      setSelectedMonth,
    ],
  );

  // ── CRUD handlers ──
  const handleCreate = useCallback(
    async (data: unknown) => {
      await createMutation.mutateAsync(data as CreateEntityDto);
      setIsCreateModalOpen(false);
    },
    [createMutation],
  );

  const handleUpdate = useCallback(
    async (data: unknown) => {
      if (!itemToEdit) return;
      try {
        await updateMutation.mutateAsync({ id: itemToEdit.id, data: data as UpdateEntityDto });
        setItemToEdit(null);
      } catch (err) {
        if (config.onUpdateError) {
          await config.onUpdateError(err, {
            entity: itemToEdit,
            formData: data,
            setGoalExceeded,
          });
          return;
        }
        throw err;
      }
    },
    [itemToEdit, updateMutation, config],
  );

  const handleExtendGoal = useCallback(async () => {
    if (!itemToEdit || !goalExceeded) return;
    const goals: Record<string, number> = {
      [goalExceeded.pocketId]: Math.max(
        goalExceeded.currentGoal,
        Math.ceil(goalExceeded.wouldBeAccumulated),
      ),
    };
    await updateMutation.mutateAsync({
      id: itemToEdit.id,
      data: {
        ...(goalExceeded.formData as UpdateEntityDto),
        goals,
      } as UpdateEntityDto,
    });
    setItemToEdit(null);
    setGoalExceeded(null);
  }, [itemToEdit, goalExceeded, updateMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }, []);

  // ── Theme & hero gradient ──
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const heroR = isDark
    ? config.colors.hero.dark[0]
    : config.colors.hero.light[0];
  const heroG = isDark
    ? config.colors.hero.dark[1]
    : config.colors.hero.light[1];
  const heroB = isDark
    ? config.colors.hero.dark[2]
    : config.colors.hero.light[2];

  const totalAmount =
    sectionProps.summary.overall?.totalAmount ??
    sectionProps.summary.yearly?.totalAmount ??
    sectionProps.summary.monthly?.totalAmount ??
    0;
  const recordCount =
    sectionProps.summary.overall?.count ??
    sectionProps.summary.yearly?.count ??
    sectionProps.summary.monthly?.count ??
    0;

  const dateRangeContext =
    filterType === 'dateRange' &&
    debouncedFilters?.startDate &&
    debouncedFilters?.endDate
      ? {
          startDate: debouncedFilters.startDate,
          endDate: debouncedFilters.endDate,
        }
      : undefined;

  const closeCreate = useCallback(
    () => setIsCreateModalOpen(false),
    [],
  );
  const closeEdit = useCallback(() => setItemToEdit(null), []);

  const { Form, DeleteModal } = config.components;

  return (
    <>
      <div className="relative z-0">
        <PageGradient
          r={heroR}
          g={heroG}
          b={heroB}
          isDark={isDark}
          static
        />
        <div className="space-y-6">
          {/* ── HEADER: summary above tabs ── */}
          <div className="relative -mt-8">
            <div className="relative pt-0 pb-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {sectionProps.layout.sectionName ||
                      config.labels.sectionName}
                  </h2>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {sectionProps.layout.title ||
                      `Resumen de ${config.labels.sectionName.toLowerCase()}`}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p
                    className={`text-2xl font-bold ${config.colors.amountText}`}
                  >
                    {config.amountSign}
                    {formatCurrency(totalAmount)}
                  </p>
                  {recordCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                      {recordCount}{' '}
                      {recordCount === 1 ? 'registro' : 'registros'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="relative flex border-b border-secondary-200 dark:border-secondary-700">
            <button
              onClick={() => handleTabChange('historia')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'historia'
                  ? `${config.colors.tabBorder} ${config.colors.navColor} ${config.colors.amountText}`
                  : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              Historia
            </button>
            <button
              onClick={() => handleTabChange('gestion')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'gestion'
                  ? `${config.colors.tabBorder} ${config.colors.navColor} ${config.colors.amountText}`
                  : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              Gestión
            </button>
          </div>

          {/* ── CONTENT ── */}
          {tab === 'gestion' ? (
            <GestionTab
              config={config}
              sectionProps={sectionProps}
              filterType={filterType}
              isFilterOpen={isFilterOpen}
              onFilterChange={handleSessionFilterChange}
              onIsFilterOpenChange={setIsFilterOpen}
              onEdit={setItemToEdit}
              onDelete={(item) => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
              onBreakdown={setItemForBreakdown}
              onCreate={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <HistoriaTab
              config={config}
              sectionProps={sectionProps}
              timelineItems={timelineItems}
              timelineConfig={timelineConfig}
              focusedItem={focusedItem}
              onFocusItem={setFocusedItem}
              onEdit={setItemToEdit}
              onDelete={(item) => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
              dateRangeContext={dateRangeContext}
            />
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreate}
        title={config.labels.createTitle}
        size="lg"
        glass
        glassBackdrop
        accentColor={
          config.createModalAccent || config.colors.accentRGB
        }
      >
        <Form
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          onCancel={closeCreate}
          initialPocketId={
            config.hasPocketFilter && pocketId
              ? pocketId
              : undefined
          }
        />
      </Modal>
      <Modal
        isOpen={!!itemToEdit}
        onClose={closeEdit}
        title={config.labels.editTitle}
        size="lg"
      >
        {itemToEdit && (
          <Form
            entity={itemToEdit}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            onCancel={closeEdit}
          />
        )}
      </Modal>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        entity={itemToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
      <AllocationBreakdownModal
        isOpen={!!itemForBreakdown}
        onClose={() => setItemForBreakdown(null)}
        title="Detalle por Bolsillo"
        allocations={itemForBreakdown?.allocations ?? []}
        accentColor={config.colors.allocationAccent}
      />

      {/* Goal Exceeded modal — income-only */}
      {config.onUpdateError && goalExceeded && (
        <Modal
          isOpen={!!goalExceeded}
          onClose={() => setGoalExceeded(null)}
          title="Meta de ahorro superada"
          description={`La edición supera la meta actual de "${goalExceeded.pocketName}".`}
          size="sm"
          glass
          glassBackdrop
          accentColor={config.colors.accentRGB}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500 dark:text-secondary-400">
                  Meta actual
                </span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {formatCurrency(goalExceeded.currentGoal ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500 dark:text-secondary-400">
                  Nuevo acumulado
                </span>
                <span className={`font-medium ${config.colors.amountText}`}>
                  {formatCurrency(
                    goalExceeded.wouldBeAccumulated ?? 0,
                  )}
                </span>
              </div>
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 flex justify-between font-semibold">
                <span className="text-secondary-900 dark:text-white">
                  Nueva meta sugerida
                </span>
                <span className={config.colors.amountText}>
                  {formatCurrency(
                    goalExceeded
                      ? Math.max(
                          goalExceeded.currentGoal,
                          Math.ceil(
                            goalExceeded.wouldBeAccumulated,
                          ),
                        )
                      : 0,
                  )}
                </span>
              </div>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
              ¿Querés extender la meta para reflejar el nuevo
              acumulado?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGoalExceeded(null)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExtendGoal}
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                Extender meta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default EntityManagement;
