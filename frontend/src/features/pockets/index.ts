// Types
export type { Pocket, CreatePocketDto, UpdatePocketDto, PocketsSummary, Deposit, RegisterDepositDto } from './types/pocket.types';

// Services
import { pocketsService } from '../../core/api';
export { pocketsService };

// Hooks
export {
  usePockets,
  usePocket,
  useCreatePocket,
  useUpdatePocket,
  useDeletePocket,
  usePocketsSummary,
  useRegisterDeposit,
  usePocketDeposits,
  usePocketForm,
  useDepositForm,
  pocketKeys,
} from './hooks';
export type { PocketFormData, DepositFormData } from './hooks';

// Components
export {
  PocketCard,
  PocketForm,
  PocketList,
  DeletePocketModal,
} from './components';

// Pages
export { PocketsPage, PocketDetailPage } from './pages';
