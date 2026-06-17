// Types
export type {
  Debt,
  CreateDebtDto,
  UpdateDebtDto,
  Payment,
  DebtSummary,
  DebtMonthlySummary,
  DebtYearlySummary,
  DebtOverallSummary,
  DebtFilters,
  DebtQueryFilters,
} from './types/debt.types';

// Services
import { debtsService } from '../../core/api';
export { debtsService };

// Hooks
export {
  useDebts,
  useDebt,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  useRegisterDebtPayment,
  useDebtSummary,
  useDebtMonthlySummary,
  useDebtYearlySummary,
  useDebtOverallSummary,
  useDebtsPaginated,
  useDebtFilters,
  useDebtForm,
  usePaymentForm,
  debtKeys,
} from './hooks';

// Components
export { DebtCard, DebtList, DebtForm, DebtFilters as DebtFiltersComponent, DeleteDebtModal, PaymentModal } from './components';

// Pages
export { DebtsPage, DebtDetailPage } from './pages';