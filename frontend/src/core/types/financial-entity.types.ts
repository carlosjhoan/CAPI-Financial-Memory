import type { BaseFilters, PaginatedMeta } from './base.types';
import type { SessionFilterType } from '../../shared/components/SessionFilters';
import type {
  CardRenderConfig,
  LayoutConfig,
  SummaryController,
  MonthlyBreakdownController,
  ViewMode,
} from '../../shared/components/EntityFinancialSection';
import type { AvailableMonth } from '../utils/timeline';

// ==========================================
// BASE ENTITY TYPE
// ==========================================

/**
 * Common shape shared by Income and Expense — the minimum fields
 * that EntityManagementPage touches for rendering and CRUD.
 */
export interface FinancialEntity {
  id: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  allocations?: { pocketId: string; pocketName: string; amount: number }[];
}

// ==========================================
// GENERIC CREATE / UPDATE DTOS
// ==========================================

/** Fields common to creating any FinancialEntity. */
export interface CreateEntityDto {
  amount: number;
  reason: string;
  date: string;
  allocations?: { pocketId: string; amount: number }[];
}

/** Fields common to updating any FinancialEntity (all optional). */
export interface UpdateEntityDto {
  amount?: number;
  reason?: string;
  date?: string;
  allocations?: { pocketId: string; amount: number }[];
}

// ==========================================
// GENERIC COMPONENT PROPS
// ==========================================

/**
 * Props contract for the Form component registered in EntityConfig.
 * Each feature config maps the generic `entity` prop to the
 * concrete prop name (e.g. `income` for IncomeForm, `expense` for ExpenseForm).
 */
export interface FormComponentProps<T extends FinancialEntity> {
  entity?: T;
  onSubmit: (data: unknown) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
  initialPocketId?: string;
}

/**
 * Props contract for the DeleteModal component registered in EntityConfig.
 * Each feature config maps `entity` to the concrete prop name.
 */
export interface DeleteModalProps<T extends FinancialEntity> {
  isOpen: boolean;
  onClose: () => void;
  entity: T | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

// ==========================================
// INCOME-SPECIFIC: GOAL EXCEEDED STATE
// ==========================================

/**
 * State for the income-only "goal exceeded" modal.
 * Triggered via EntityConfig.onUpdateError when the backend
 * returns INCOME_EDIT_EXCEEDS_GOAL.
 */
export interface GoalExceededState<T extends FinancialEntity> {
  pocketId: string;
  pocketName: string;
  currentGoal: number;
  wouldBeAccumulated: number;
  entity: T;
  formData: unknown;
}

// ==========================================
// SECTION HOOK RETURN TYPE
// ==========================================

/**
 * Return type of the section hook registered in EntityConfig.hooks.useSection.
 * Covers all fields consumed by EntityManagementPage (both Gestión and Historia tabs).
 */
export interface SectionReturn<T extends FinancialEntity> {
  items: T[];
  paginationMeta?: PaginatedMeta;
  error: Error | null;
  viewMode: ViewMode;
  card: CardRenderConfig<T>;
  summary: SummaryController;
  monthlyBreakdown: MonthlyBreakdownController;
  onPageChange: (page: number) => void;
  onCreate?: () => void;
  layout: LayoutConfig;

  /** Timeline navigation (Historia tab — only present when viewMode === 'all'). */
  timelineNavigation?: {
    availableMonths: AvailableMonth[];
    currentMonthIndex: number;
    currentMonth: AvailableMonth | null;
    goToNextMonth: () => void;
    transitioning: boolean;
    monthItems: T[];
  };
}

// ==========================================
// ENTITY CONFIG
// ==========================================

/**
 * Complete configuration object that drives EntityManagementPage.
 * Feature-specific behavior enters through this config.
 */
export interface EntityConfig<T extends FinancialEntity> {
  /** Machine name for query keys, analytics, etc. (e.g. 'incomes', 'expenses'). */
  name: string;
  /** Capitalized entity name for type identification (e.g. 'Income', 'Expense'). */
  entityName: string;
  /** sessionStorage key for the animation gate. */
  animationKey: string;
  /** Session filter accent color passed to FloatingFilterToggle + FloatingActionButton. */
  filterAccent: 'green' | 'orange';

  colors: {
    /** Tailwind accent name for tab borders and hover states. */
    accentName: string;
    /** RGB string for GlassCard accentColor prop (e.g. '34,197,94'). */
    accentRGB: string;
    /** RGB for AllocationBreakdownModal accentColor. */
    allocationAccent: string;
    /** Hero gradient RGB values. */
    hero: { light: [number, number, number]; dark: [number, number, number] };
    /** Amount text color classes. */
    amountText: string;
    /** Month badge background color classes. */
    badgeBg: string;
    /** Month badge text color classes. */
    badgeText: string;
    /** Timeline status dot class. */
    statusDot: string;
    /** RecordFocusCard detail divider. */
    dividerColor: string;
    /** Detail icon hover color. */
    iconHover: string;
    /** "Ver más" link color. */
    linkColor: string;
    /** Navigation link color (for routes). */
    navColor: string;
    /** Active tab border color class (e.g. 'border-green-500'). */
    tabBorder: string;
  };

  labels: {
    /** Section header title. */
    sectionName: string;
    /** FAB label. */
    fabLabel: string;
    /** Modal title for create. */
    createTitle: string;
    /** Modal title for edit. */
    editTitle: string;
    /** Empty state message. */
    emptyMessage: string;
    /** Empty state action label. */
    emptyActionLabel: string;
    /** Entity name singular for month group count. */
    entitySingular: string;
    /** Entity name plural for month group count. */
    entityPlural: string;
  };

  /** Amount sign prefix character. */
  amountSign: '+' | '-';

  hooks: {
    useSection: (options: {
      filters?: BaseFilters;
      filterType?: SessionFilterType;
      card: CardRenderConfig<T>;
      layout?: Partial<LayoutConfig>;
    }) => SectionReturn<T>;
    useCreate: () => {
      mutateAsync: (data: CreateEntityDto) => Promise<T>;
      isPending: boolean;
    };
    useUpdate: () => {
      mutateAsync: (args: { id: string; data: UpdateEntityDto }) => Promise<T>;
      isPending: boolean;
    };
    useDelete: () => {
      mutateAsync: (id: string) => Promise<void>;
      isPending: boolean;
    };
  };

  components: {
    /**
     * Form component for creating/editing.
     * Each feature config maps the generic `entity` prop to the
     * concrete prop name (e.g. `income` for IncomeForm, `expense` for ExpenseForm).
     */
    Form: React.ComponentType<FormComponentProps<T>>;
    /** Delete confirmation modal. Maps generic `entity` to concrete prop internally. */
    DeleteModal: React.ComponentType<DeleteModalProps<T>>;
  };

  /** Whether this entity supports pocket pre-selection from URL (?pocketId=). */
  hasPocketFilter?: boolean;

  /**
   * Income-only callback for the goal-exceeded error flow.
   * Expense config provides a no-op that re-throws.
   */
  onUpdateError?: (
    err: unknown,
    params: {
      entity: T;
      formData: unknown;
      setGoalExceeded: (ge: GoalExceededState<T> | null) => void;
    },
  ) => void | Promise<void>;

  /** Whether to show the "Ver más" load-more button in Gestión tab. */
  showLoadMore?: boolean;

  /**
   * Create modal accent color override for the Modal glass backdrop.
   * Income: "34,197,94" (green), Expense: "239,68,68" (red).
   */
  createModalAccent?: string;
}
