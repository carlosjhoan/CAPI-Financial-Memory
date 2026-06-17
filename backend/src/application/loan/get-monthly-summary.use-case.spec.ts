import { GetMonthlySummaryUseCase } from './get-monthly-summary.use-case';
import { LoanService } from '../../domain/services/loan.service';

describe('GetMonthlySummaryUseCase', () => {
  let useCase: GetMonthlySummaryUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getMonthlySummary: jest.fn(),
    } as any;
    useCase = new GetMonthlySummaryUseCase(mockService);
  });

  it('should call loanService.getMonthlySummary with correct year and month', async () => {
    const mockSummary = {
      month: 'January 2024',
      totalAmountLent: 5000,
      totalInterest: 500,
      totalReceived: 1000,
      totalPending: 4000,
      loanCount: 5,
      fullyPaidCount: 1,
      activeCount: 4,
      byDebtor: { Juan: 3000, Pedro: 2000 },
      byDay: { '15': 5000 },
    };
    mockService.getMonthlySummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute('user-1', 2024, 0);

    expect(mockService.getMonthlySummary).toHaveBeenCalledWith('user-1', 2024, 0);
    expect(result).toEqual(mockSummary);
  });

  it('should propagate errors from the service', async () => {
    mockService.getMonthlySummary.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute('user-1', 2024, 0)).rejects.toThrow('Database error');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});