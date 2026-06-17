import { GetAllLoansUseCase } from './get-all-loans.use-case';
import { LoanService } from '../../domain/services/loan.service';
import { Loan } from '../../domain/entities/loan.entity';

describe('GetAllLoansUseCase', () => {
  let useCase: GetAllLoansUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getAllLoans: jest.fn(),
      getAllLoansPaginated: jest.fn(),
    } as any;
    useCase = new GetAllLoansUseCase(mockService);
  });

  describe('execute', () => {
    it('should call loanService.getAllLoans and return loans', async () => {
      const mockLoans = [
        new Loan(1000, 10, 100, 'Juan', new Date()),
        new Loan(2000, 15, 200, 'Pedro', new Date()),
      ];
      mockService.getAllLoans.mockResolvedValue(mockLoans);

      const result = await useCase.execute('user-1');

      expect(mockService.getAllLoans).toHaveBeenCalled();
      expect(result).toEqual(mockLoans);
    });

    it('should propagate errors from getAllLoans', async () => {
      mockService.getAllLoans.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-1')).rejects.toThrow('Database error');
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});