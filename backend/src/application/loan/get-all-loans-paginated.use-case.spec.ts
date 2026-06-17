import { GetAllLoansPaginatedUseCase } from './get-all-loans-paginated.use-case';
import { LoanService } from '../../domain/services/loan.service';
import { Loan } from '../../domain/entities/loan.entity';
import { LoanQueryDto } from '../../infrastructure/web/dto/loan-query.dto';

describe('GetAllLoansPaginatedUseCase', () => {
  let useCase: GetAllLoansPaginatedUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getAllLoansPaginated: jest.fn(),
    } as any;
    useCase = new GetAllLoansPaginatedUseCase(mockService);
  });

  describe('execute', () => {
    it('should call loanService.getAllLoansPaginated with correct query', async () => {
      const mockResult = {
        data: [
          new Loan(1000, 10, 100, 'Juan', new Date()),
        ],
        total: 1,
      };
      const query: LoanQueryDto = { page: 1, limit: 10 };
      mockService.getAllLoansPaginated.mockResolvedValue(mockResult);

      const result = await useCase.execute('user-1', query);

      expect(mockService.getAllLoansPaginated).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from getAllLoansPaginated', async () => {
      mockService.getAllLoansPaginated.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-1', {})).rejects.toThrow('Database error');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});