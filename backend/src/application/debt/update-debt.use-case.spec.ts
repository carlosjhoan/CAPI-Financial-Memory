import { UpdateDebtUseCase } from './update-debt.use-case';
import { DebtService } from '../../domain/services/debt.service';
import { Debt } from '../../domain/entities/debt.entity';

describe('UpdateDebtUseCase', () => {
  let useCase: UpdateDebtUseCase;
  let mockService: jest.Mocked<DebtService>;

  beforeEach(() => {
    mockService = {
      getAllDebts: jest.fn(),
      getAllDebtsPaginated: jest.fn(),
      getDebtById: jest.fn(),
      updateDebt: jest.fn(),
      deleteDebt: jest.fn(),
      getDebtsSummary: jest.fn(),
      getMonthlySummary: jest.fn(),
      getYearlySummary: jest.fn(),
    } as any;
    useCase = new UpdateDebtUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.updateDebt with id and updates', async () => {
      const mockDebt = new Debt(1000, 'Bank A', 12, 100, 1200, new Date(), 'Reason', '1');
      const updates = { lender: 'Bank B' };
      mockService.updateDebt.mockResolvedValue(mockDebt);

      const result = await useCase.execute('user-1', '1', updates);

      expect(mockService.updateDebt).toHaveBeenCalledWith('user-1', '1', updates);
      expect(result).toEqual(mockDebt);
    });

    it('should propagate errors from updateDebt', async () => {
      const updates = { lender: 'Bank B' };
      mockService.updateDebt.mockRejectedValue(new Error('Invalid update'));

      await expect(useCase.execute('user-1', '1', updates)).rejects.toThrow('Invalid update');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});