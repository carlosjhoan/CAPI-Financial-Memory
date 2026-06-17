import { PocketService } from './pocket.service';
import { Pocket } from '../entities/pocket.entity';
import { PocketRepository } from '../repositories/pocket.repository';
import { CreatePocketUseCase } from '../../application/pocket/create-pocket.use-case';
import { RegisterDepositUseCase } from '../../application/pocket/register-deposit.use-case';

function createMockPocket(id: string, accumulatedAmount: number): Pocket {
  const pocket = new Pocket('Test', 'deposit', 0, accumulatedAmount, 'test', id);
  pocket.accumulatedAmount = accumulatedAmount;
  return pocket;
}

describe('PocketService', () => {
  let service: PocketService;
  let mockRepository: jest.Mocked<PocketRepository>;
  let mockCreatePocketUseCase: jest.Mocked<CreatePocketUseCase>;
  let mockRegisterDepositUseCase: jest.Mocked<RegisterDepositUseCase>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      getSummary: jest.fn(),
      findDepositsByPocketId: jest.fn(),
      findExpensesByPocketId: jest.fn(),
      findTransfersByPocketId: jest.fn(),
      findHistoryByPocketId: jest.fn(),
      saveDeposit: jest.fn(),
      saveTransfer: jest.fn(),
    } as any;

    mockCreatePocketUseCase = { execute: jest.fn() } as any;
    mockRegisterDepositUseCase = { execute: jest.fn() } as any;

    service = new PocketService(
      mockRepository,
      mockCreatePocketUseCase,
      mockRegisterDepositUseCase,
    );
  });

  describe('deletePocket', () => {
    it('should delete pocket when accumulatedAmount is 0', async () => {
      const pocket = createMockPocket('pocket-1', 0);
      mockRepository.findById.mockResolvedValue(pocket);
      mockRepository.delete.mockResolvedValue();

      await service.deletePocket('user-1', 'pocket-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('user-1', 'pocket-1');
    });

    it('should throw CANNOT_DELETE_WITH_FUNDS when accumulatedAmount > 0', async () => {
      const pocket = createMockPocket('pocket-1', 500);
      mockRepository.findById.mockResolvedValue(pocket);

      await expect(service.deletePocket('user-1', 'pocket-1'))
        .rejects
        .toThrow('CANNOT_DELETE_WITH_FUNDS:500');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw "Pocket not found" for non-existent pocket', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deletePocket('user-1', 'invalid-id'))
        .rejects
        .toThrow('Pocket not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should include the exact accumulatedAmount value in the error', async () => {
      const pocket = createMockPocket('pocket-1', 1234.56);
      mockRepository.findById.mockResolvedValue(pocket);

      await expect(service.deletePocket('user-1', 'pocket-1'))
        .rejects
        .toThrow('CANNOT_DELETE_WITH_FUNDS:1234.56');
    });
  });
});
