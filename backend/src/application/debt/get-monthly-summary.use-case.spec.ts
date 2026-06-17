import { GetMonthlySummaryUseCase } from './get-monthly-summary.use-case';
import { DebtService } from '../../domain/services/debt.service';

describe('GetMonthlySummaryUseCase', () => {
  let useCase: GetMonthlySummaryUseCase;
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
    useCase = new GetMonthlySummaryUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.getMonthlySummary with year and month', async () => {
      const mockSummary = {
        month: 'January 2024',
        totalAmount: 5000,
        totalRemaining: 4000,
        debtCount: 3,
        fullyPaidCount: 1,
        activeCount: 2,
        byLender: { 'Bank A': 3000, 'Bank B': 2000 },
        byDay: { '01': 1000, '15': 4000 },
      };
      mockService.getMonthlySummary.mockResolvedValue(mockSummary);

      const result = await useCase.execute('user-1', 2024, 0);

      expect(mockService.getMonthlySummary).toHaveBeenCalledWith('user-1', 2024, 0);
      expect(result).toEqual(mockSummary);
    });

    it('should propagate errors from getMonthlySummary', async () => {
      mockService.getMonthlySummary.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-1', 2024, 0)).rejects.toThrow('Database error');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});