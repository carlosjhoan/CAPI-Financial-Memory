import { GetAllDebtsPaginatedUseCase } from './get-all-debts-paginated.use-case';
import { DebtService } from '../../domain/services/debt.service';
import { Debt } from '../../domain/entities/debt.entity';
import { DebtQueryDto } from '../../infrastructure/web/dto/debt-query.dto';

describe('GetAllDebtsPaginatedUseCase', () => {
  let useCase: GetAllDebtsPaginatedUseCase;
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
    useCase = new GetAllDebtsPaginatedUseCase(mockService);
  });

  describe('execute', () => {
    it('should call debtService.getAllDebtsPaginated with query', async () => {
      const mockQuery: DebtQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [
          new Debt(1000, 'Bank A', 12, 100, 1200, new Date(), 'Reason', '1'),
        ],
        total: 1,
      };
      mockService.getAllDebtsPaginated.mockResolvedValue(mockResult);

      const result = await useCase.execute('user-1', mockQuery);

      expect(mockService.getAllDebtsPaginated).toHaveBeenCalledWith('user-1', mockQuery);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from getAllDebtsPaginated', async () => {
      const mockQuery: DebtQueryDto = { page: 1, limit: 10 };
      mockService.getAllDebtsPaginated.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-1', mockQuery)).rejects.toThrow('Database error');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});