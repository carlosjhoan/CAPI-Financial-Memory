import { CreateIncomeUseCase } from './create-income.use-case';
import { IncomeRepository } from '../../domain/repositories/income.repository';
import { Income } from '../../domain/entities/income.entity';
import { DataSource } from 'typeorm';

describe('CreateIncomeUseCase', () => {
  let useCase: CreateIncomeUseCase;
  let mockRepo: jest.Mocked<IncomeRepository>;
  let mockDataSource: jest.Mocked<DataSource>;

  const mockAllocations = [{ pocketId: 'uuid-1', amount: 100 }];

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb: any) =>
        cb({
          create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data })),
          save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: "uuid-1" })),
        }),
      ),
    } as any;

    useCase = new CreateIncomeUseCase(mockRepo, mockDataSource);
  });

  it('should create an income successfully', async () => {
    const date = new Date('2024-01-15');

    const result = await useCase.execute('user-1', 100, 'Salary', date, mockAllocations);

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(result.amount).toBe(100);
    expect(result.reason).toBe('Salary');
    expect(result.id).toBe('uuid-1');
  });

  it('should throw if amount is 0', async () => {
    await expect(
      useCase.execute('user-1', 0, 'Salary', new Date(), mockAllocations),
    ).rejects.toThrow('Amount must be greater than 0');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if amount is negative', async () => {
    await expect(
      useCase.execute('user-1', -100, 'Salary', new Date(), mockAllocations),
    ).rejects.toThrow('Amount must be greater than 0');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if reason is empty', async () => {
    await expect(
      useCase.execute('user-1', 100, '', new Date(), mockAllocations),
    ).rejects.toThrow('Reason is required');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if reason is whitespace', async () => {
    await expect(
      useCase.execute('user-1', 100, '   ', new Date(), mockAllocations),
    ).rejects.toThrow('Reason is required');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
