import { GetDebtsSummaryUseCase } from './get-debts-summary.use-case';
import { DebtService } from '../../domain/services/debt.service';

describe('GetDebtsSummaryUseCase', () => {
  let useCase: GetDebtsSummaryUseCase;
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
    useCase = new GetDebtsSummaryUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.getDebtsSummary and return summary', async () => {
      const mockSummary = {
        totalDebts: 5,
        totalAmount: 10000,
        totalPaid: 3000,
        totalRemaining: 7000,
        fullyPaidCount: 1,
        activeDebtsCount: 4,
      };
      mockService.getDebtsSummary.mockResolvedValue(mockSummary);

      const result = await useCase.execute('user-1');

      expect(mockService.getDebtsSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });

    it('should propagate errors from getDebtsSummary', async () => {
      mockService.getDebtsSummary.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-1')).rejects.toThrow('Database error');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});