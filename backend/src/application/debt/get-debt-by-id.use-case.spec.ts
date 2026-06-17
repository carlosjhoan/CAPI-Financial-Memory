import { GetDebtByIdUseCase } from './get-debt-by-id.use-case';
import { DebtService } from '../../domain/services/debt.service';
import { Debt } from '../../domain/entities/debt.entity';

describe('GetDebtByIdUseCase', () => {
  let useCase: GetDebtByIdUseCase;
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
    useCase = new GetDebtByIdUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.getDebtById with id', async () => {
      const mockDebt = new Debt(1000, 'Bank A', 12, 100, 1200, new Date(), 'Reason', '1');
      mockService.getDebtById.mockResolvedValue(mockDebt);

      const result = await useCase.execute('user-1', '1');

      expect(mockService.getDebtById).toHaveBeenCalledWith('user-1', '1');
      expect(result).toEqual(mockDebt);
    });

    it('should propagate errors from getDebtById', async () => {
      mockService.getDebtById.mockRejectedValue(new Error('Debt not found'));

      await expect(useCase.execute('user-1', '1')).rejects.toThrow('Debt not found');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});