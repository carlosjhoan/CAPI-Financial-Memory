import { GetLoanByIdUseCase } from './get-loan-by-id.use-case';
import { LoanService } from '../../domain/services/loan.service';
import { Loan } from '../../domain/entities/loan.entity';

describe('GetLoanByIdUseCase', () => {
  let useCase: GetLoanByIdUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getLoanById: jest.fn(),
    } as any;
    useCase = new GetLoanByIdUseCase(mockService);
  });

  it('should call loanService.getLoanById with the correct id', async () => {
    const mockLoan = new Loan(1000, 10, 100, 'Juan', new Date());
    mockService.getLoanById.mockResolvedValue(mockLoan);

    const result = await useCase.execute('user-1', '1');

    expect(mockService.getLoanById).toHaveBeenCalledWith('user-1', '1');
    expect(result).toEqual(mockLoan);
  });

  it('should propagate errors from the service', async () => {
    mockService.getLoanById.mockRejectedValue(new Error('Not found'));

    await expect(useCase.execute('user-1', '999')).rejects.toThrow('Not found');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});