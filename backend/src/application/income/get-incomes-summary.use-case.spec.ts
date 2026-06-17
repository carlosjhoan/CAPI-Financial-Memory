import { GetIncomesSummaryUseCase } from './get-incomes-summary.use-case';
import { IncomeService } from '../../domain/services/income.service';
import { Income } from '../../domain/entities/income.entity';

describe('GetIncomesSummaryUseCase', () => {
  let useCase: GetIncomesSummaryUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getIncomesSummary: jest.fn(),
    } as any;
    useCase = new GetIncomesSummaryUseCase(mockService);
  });

  it('should call incomeService.getIncomesSummary and return the summary', async () => {
    const mockSummary = {
      totalIncomes: 3,
      totalAmount: 600,
      averageAmount: 200,
      highestIncome: new Income(300, 'Freelance', new Date(), '1'),
      recentIncomes: [],
    };
    mockService.getIncomesSummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute('user-1');

    expect(mockService.getIncomesSummary).toHaveBeenCalled();
    expect(result).toEqual(mockSummary);
  });

  it('should propagate errors from the service', async () => {
    mockService.getIncomesSummary.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(useCase.execute('user-1')).rejects.toThrow('Database error');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
