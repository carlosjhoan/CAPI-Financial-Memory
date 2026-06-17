import { DeleteDebtUseCase } from './delete-debt.use-case';
import { DebtService } from '../../domain/services/debt.service';

describe('DeleteDebtUseCase', () => {
  let useCase: DeleteDebtUseCase;
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
    useCase = new DeleteDebtUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.deleteDebt with id', async () => {
      mockService.deleteDebt.mockResolvedValue(undefined);

      await useCase.execute('user-1', '1');

      expect(mockService.deleteDebt).toHaveBeenCalledWith('user-1', '1');
    });

    it('should propagate errors from deleteDebt', async () => {
      mockService.deleteDebt.mockRejectedValue(new Error('Debt not found'));

      await expect(useCase.execute('user-1', '1')).rejects.toThrow('Debt not found');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});