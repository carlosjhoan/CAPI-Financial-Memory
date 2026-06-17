// Types
export type {
  Loan,
  CreateLoanDto,
  UpdateLoanDto,
  LoanFilters,
  LoanOverallSummary,
  LoanPerformance,
  MonthlySummary,
  YearlySummary,
  LoanPayment,
} from './types/loan.types';

// Services
import { loansService } from '../../core/api';
export { loansService };

// Hooks
export {
  useLoans,
  useLoan,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  useRegisterPayment,
  useOverallSummary,
  useMonthlySummary,
  useYearlySummary,
  useLoanPerformance,
  useLoansPaginated,
  useLoanFilters,
  useLoanForm,
  loanKeys,
} from './hooks';

// Components
export {
  LoanCard,
  LoanList,
  LoanForm,
  DeleteLoanModal,
  RegisterPaymentModal,
  usePaymentForm,
} from './components';

// Pages
export { LoansPage, LoanDetailPage } from './pages';
