import { DeleteIncomeUseCase } from './delete-income.use-case';
import { IncomeService } from '../../domain/services/income.service';

describe('DeleteIncomeUseCase', () => {
  let useCase: DeleteIncomeUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      deleteIncome: jest.fn(),
    } as any;
    useCase = new DeleteIncomeUseCase(mockService);
  });

  it('should call incomeService.deleteIncome with the correct id', async () => {
    mockService.deleteIncome.mockResolvedValue(undefined);

    const result = await useCase.execute('user-1', '1');

    expect(mockService.deleteIncome).toHaveBeenCalledWith('user-1', '1');
    expect(result).toBeUndefined();
  });

  it('should propagate errors from the service', async () => {
    mockService.deleteIncome.mockRejectedValue(new Error('Income not found'));

    await expect(useCase.execute('user-1', '999')).rejects.toThrow('Income not found');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
