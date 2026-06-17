import { TransferBetweenPocketsUseCase } from './transfer-between-pockets.use-case';
import { PocketRepository } from '../../domain/repositories/pocket.repository';
import { Pocket } from '../../domain/entities/pocket.entity';
import { PocketTransfer } from '../../domain/entities/pocket-transfer.entity';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import { PocketEntity } from '../../infrastructure/persistence/postgres/entities/pocket.entity';
import { PocketTransferEntity } from '../../infrastructure/persistence/postgres/entities/pocket-transfer.entity';

function createMockPocket(id: string, accumulatedAmount: number, type = 'deposit', goal = 0): Pocket {
  const pocket = new Pocket('Test', type as any, goal, accumulatedAmount, '', id);
  pocket.accumulatedAmount = accumulatedAmount;
  pocket.goal = goal;
  return pocket;
}

function createMockEntity(id: string, accumulatedAmount: number, type = 'deposit', goal = 0): PocketEntity {
  const entity = new PocketEntity();
  entity.id = id;
  entity.name = 'Test';
  entity.type = type;
  entity.goal = goal;
  entity.accumulatedAmount = accumulatedAmount;
  entity.initialAmount = 0;
  entity.motivation = '';
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  return entity;
}

describe('TransferBetweenPocketsUseCase', () => {
  let useCase: TransferBetweenPocketsUseCase;
  let mockRepository: jest.Mocked<PocketRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: Partial<jest.Mocked<EntityManager>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      getSummary: jest.fn(),
      findDepositsByPocketId: jest.fn(),
      findExpensesByPocketId: jest.fn(),
      findTransfersByPocketId: jest.fn(),
      findHistoryByPocketId: jest.fn(),
      saveDeposit: jest.fn(),
      saveTransfer: jest.fn(),
    } as any;

    mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        return cb(mockEntityManager);
      }),
    } as any;

    useCase = new TransferBetweenPocketsUseCase(mockRepository, mockDataSource);
  });

  describe('goal overflow validation', () => {
    function setupTransferTest(amount: number, type = 'goal', goal = 1000) {
      const sourcePocket = createMockPocket('source-1', 1000);
      const targetPocket = createMockPocket('target-1', 800, type as any, goal);
      mockRepository.findById
        .mockReset()
        .mockResolvedValueOnce(sourcePocket)
        .mockResolvedValueOnce(targetPocket);

      mockQueryBuilder.getOne
        .mockReset()
        .mockResolvedValueOnce(createMockEntity('source-1', 1000))
        .mockResolvedValueOnce(createMockEntity('target-1', 800, type, goal));

      const savedTransfer = new PocketTransferEntity();
      savedTransfer.sourcePocketId = 'source-1';
      savedTransfer.targetPocketId = 'target-1';
      savedTransfer.amount = amount;
      savedTransfer.reason = 'test';
      savedTransfer.date = new Date();
      savedTransfer.id = 't1';
      savedTransfer.createdAt = new Date();
      mockEntityManager.save!.mockResolvedValue(savedTransfer);
      mockEntityManager.create!.mockImplementation(() => savedTransfer as any);
    }

    it('should allow transfer when amount does not exceed remaining goal', async () => {
      setupTransferTest(100);
      const result = await useCase.execute('user-1', 'source-1', 'target-1', 100, 'test', new Date());
      expect(result).toBeDefined();
      expect(result.amount).toBe(100);
    });

    it('should throw TRANSFER_EXCEEDS_GOAL when amount exceeds remaining goal and no newGoal', async () => {
      const sourcePocket = createMockPocket('source-1', 1000);
      const targetPocket = createMockPocket('target-1', 800, 'goal', 1000);
      mockRepository.findById
        .mockReset()
        .mockResolvedValueOnce(sourcePocket)
        .mockResolvedValueOnce(targetPocket);

      mockQueryBuilder.getOne
        .mockReset()
        .mockResolvedValueOnce(createMockEntity('source-1', 1000))
        .mockResolvedValueOnce(createMockEntity('target-1', 800, 'goal', 1000));

      await expect(
        useCase.execute('user-1', 'source-1', 'target-1', 300, 'test', new Date()),
      ).rejects.toThrow('TRANSFER_EXCEEDS_GOAL:200:300:target-1');
    });

    it('should extend goal when newGoal param is provided and valid', async () => {
      const sourcePocket = createMockPocket('source-1', 1000);
      const targetPocket = createMockPocket('target-1', 800, 'goal', 1000);
      mockRepository.findById
        .mockReset()
        .mockResolvedValueOnce(sourcePocket)
        .mockResolvedValueOnce(targetPocket);

      mockQueryBuilder.getOne
        .mockReset()
        .mockResolvedValueOnce(createMockEntity('source-1', 1000))
        .mockResolvedValueOnce(createMockEntity('target-1', 800, 'goal', 1000));

      const savedTransfer = new PocketTransferEntity();
      savedTransfer.sourcePocketId = 'source-1';
      savedTransfer.targetPocketId = 'target-1';
      savedTransfer.amount = 300;
      savedTransfer.reason = 'extend';
      savedTransfer.date = new Date();
      savedTransfer.id = 't1';
      savedTransfer.createdAt = new Date();
      mockEntityManager.save!.mockResolvedValue(savedTransfer);
      mockEntityManager.create!.mockImplementation(() => savedTransfer as any);

      await useCase.execute('user-1', 'source-1', 'target-1', 300, 'extend', new Date(), 1200);

      // Verify goal was extended on the target entity save call
      // save is called: 1st = source debit, 2nd = target credit (with updated goal)
      const targetSaveCall = (mockEntityManager.save as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] && typeof call[0] === 'object' && call[0].id === 'target-1'
      );
      expect(targetSaveCall).toBeDefined();
      expect(targetSaveCall![0].goal).toBe(1200);
    });

    it('should not affect deposit-type pockets with goal overflow check', async () => {
      setupTransferTest(999, 'deposit', 0);
      const result = await useCase.execute('user-1', 'source-1', 'target-1', 999, 'big deposit', new Date());
      expect(result).toBeDefined();
      expect(result.amount).toBe(999);
    });
  });
});
