import type { Income } from './types/income.types';
import type { EntityConfig, FormComponentProps, DeleteModalProps } from '../../core/types/financial-entity.types';
import { useIncomeSection } from '../../core/hooks/useIncomeSection';
import { useCreateIncome, useUpdateIncome, useDeleteIncome } from './hooks/useIncomes';
import IncomeForm from './components/IncomeForm';
import DeleteIncomeModal from './components/DeleteIncomeModal';

// ==========================================
// WRAPPER COMPONENTS
// ==========================================

/**
 * Maps the generic `entity` prop from EntityConfig
 * to the concrete `income` prop expected by IncomeForm.
 */
const IncomeFormWrapper = ({ entity, ...props }: FormComponentProps<Income>) =>
  entity ? <IncomeForm income={entity} {...props} /> : <IncomeForm {...props} />;

/**
 * Maps the generic `entity` prop from EntityConfig
 * to the concrete `income` prop expected by DeleteIncomeModal.
 */
const DeleteIncomeModalWrapper = ({ entity, ...props }: DeleteModalProps<Income>) =>
  <DeleteIncomeModal income={entity} {...props} />;

// ==========================================
// ENTITY CONFIG
// ==========================================

export const incomeEntityConfig: EntityConfig<Income> = {
  name: 'incomes',
  entityName: 'Income',
  animationKey: 'pfm-incomes-animated',
  filterAccent: 'green',

  colors: {
    accentName: 'green',
    accentRGB: '34,197,94',
    allocationAccent: '34,197,94',
    hero: { light: [22, 163, 74], dark: [74, 222, 128] },
    amountText: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-100 dark:bg-green-900/30',
    badgeText: 'text-green-700 dark:text-green-400',
    statusDot: 'bg-green-500',
    dividerColor: 'bg-green-500/30',
    iconHover: 'hover:text-green-500 hover:bg-green-500/10',
    linkColor: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300',
    navColor: 'text-green-600 dark:text-green-400',
    tabBorder: 'border-green-500',
  },

  labels: {
    sectionName: 'Ingresos',
    fabLabel: 'Nuevo Ingreso',
    createTitle: 'Nuevo Ingreso',
    editTitle: 'Editar Ingreso',
    emptyMessage: 'No hay ingresos',
    emptyActionLabel: 'Crear Primer Ingreso',
    entitySingular: 'ingreso',
    entityPlural: 'ingresos',
  },

  amountSign: '+',

  hooks: {
    useSection: useIncomeSection,
    useCreate: useCreateIncome,
    useUpdate: useUpdateIncome,
    useDelete: useDeleteIncome,
  },

  components: {
    Form: IncomeFormWrapper,
    DeleteModal: DeleteIncomeModalWrapper,
  },

  hasPocketFilter: true,

  onUpdateError: (err, { entity, formData, setGoalExceeded }) => {
    const msg = err instanceof Error ? err.message : String(err);
    const match = msg.match(/^INCOME_EDIT_EXCEEDS_GOAL:(.+?):(.+?):([\d.]+):([\d.]+)$/);
    if (match) {
      setGoalExceeded({
        pocketId: match[1],
        pocketName: match[2],
        currentGoal: Number(match[3]),
        wouldBeAccumulated: Number(match[4]),
        entity,
        formData,
      });
      return; // handled — don't re-throw
    }
    throw err; // not a goal-exceeded error — propagate
  },

  showLoadMore: true,
  createModalAccent: '34,197,94',
};
