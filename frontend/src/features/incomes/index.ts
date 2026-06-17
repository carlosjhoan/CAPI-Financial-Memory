// Tipos
export type { 
  Income, 
  CreateIncomeDto, 
  UpdateIncomeDto, 
  IncomeFilters,
  MonthlySummary,
  YearlySummary,
  OverallSummary 
} from './types';

// Servicios
export { incomesService } from './services';

// Hooks
export { 
  useIncomes, 
  useIncome, 
  useCreateIncome, 
  useUpdateIncome, 
  useDeleteIncome,
  useMonthlySummary,
  useYearlySummary,
  useOverallSummary,
  incomeKeys,
  useIncomeForm,
  type IncomeFormData,
  useIncomeFilters 
} from './hooks';

// Componentes
export { 
  IncomeCard,
  IncomeForm,
  IncomeList,
  IncomeFilters as IncomeFiltersComponent,
  DeleteIncomeModal 
} from './components';

// Páginas
export { IncomesPage, IncomeDetailPage } from './pages';