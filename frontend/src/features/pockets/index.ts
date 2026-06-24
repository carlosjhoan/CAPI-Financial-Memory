// Types
export type { Pocket, CreatePocketDto, UpdatePocketDto, PocketsSummary } from './types/pocket.types';

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
  usePocketForm,
  pocketKeys,
} from './hooks';
export type { PocketFormData } from './hooks';

// Components
export {
  PocketCard,
  PocketForm,
  PocketList,
  DeletePocketModal,
} from './components';

// Pages
export { PocketsPage, PocketDetailPage } from './pages';
