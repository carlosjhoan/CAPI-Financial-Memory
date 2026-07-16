/* eslint-disable react-refresh/only-export-components */

import type { Expense } from './types/expense.types';
import type { EntityConfig, FormComponentProps, DeleteModalProps } from '../../core/types/financial-entity.types';
import { useExpenseSection } from '../../core/hooks/useExpenseSection';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from './hooks/useExpenses';
import ExpenseForm from './components/ExpenseForm';
import DeleteExpenseModal from './components/DeleteExpenseModal';

// ponytail: ExpenseForm doesn't have initialPocketId — strip it here
const ExpenseFormWrapper = ({
  entity,
  initialPocketId: _p,
  ...props
}: FormComponentProps<Expense>) =>
  entity ? <ExpenseForm expense={entity} {...props} /> : <ExpenseForm {...props} />;

const DeleteExpenseModalWrapper = ({
  entity,
  ...props
}: DeleteModalProps<Expense>) => (
  <DeleteExpenseModal expense={entity} {...props} />
);

export const expenseEntityConfig: EntityConfig<Expense> = {
  name: 'expenses',
  entityName: 'Expense',
  animationKey: 'pfm-expenses-animated',
  filterAccent: 'orange',

  colors: {
    accentName: 'orange',
    accentRGB: '251,146,60',
    allocationAccent: '239,68,68',
    hero: { light: [234, 88, 12], dark: [251, 146, 60] },
    amountText: 'text-red-500 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    badgeText: 'text-red-700 dark:text-red-400',
    statusDot: 'bg-orange-500',
    dividerColor: 'bg-orange-500/30',
    iconHover: 'hover:text-orange-500 hover:bg-orange-500/10',
    linkColor: 'text-orange-600 dark:text-orange-400',
    navColor: 'text-orange-600 dark:text-orange-400',
    tabBorder: 'border-orange-500',
  },

  labels: {
    sectionName: 'Gastos',
    fabLabel: 'Nuevo Gasto',
    createTitle: 'Nuevo Gasto',
    editTitle: 'Editar Gasto',
    emptyMessage: 'No hay gastos',
    emptyActionLabel: 'Crear Primer Gasto',
    entitySingular: 'gasto',
    entityPlural: 'gastos',
  },

  amountSign: '-',

  hooks: {
    useSection: useExpenseSection,
    useCreate: useCreateExpense,
    useUpdate: useUpdateExpense,
    useDelete: useDeleteExpense,
  },

  components: {
    Form: ExpenseFormWrapper,
    DeleteModal: DeleteExpenseModalWrapper,
  },

  hasPocketFilter: false,
  onUpdateError: undefined,
  showLoadMore: true,
  createModalAccent: undefined,
};
