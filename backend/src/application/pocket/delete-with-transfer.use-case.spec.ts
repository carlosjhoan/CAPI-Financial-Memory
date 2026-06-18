import { DeleteWithTransferUseCase } from "./delete-with-transfer.use-case";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";
import { DepositEntity } from "../../infrastructure/persistence/postgres/entities/deposit.entity";

function createMockPocket(
  id: string,
  accumulatedAmount: number,
  type = "deposit",
  goal = 0,
): Pocket {
  const pocket = new Pocket(
    "Test",
    type as any,
    goal,
    accumulatedAmount,
    "",
    id,
  );
  pocket.accumulatedAmount = accumulatedAmount;
  pocket.goal = goal;
  return pocket;
}

function createMockEntity(
  id: string,
  accumulatedAmount: number,
  type = "deposit",
  goal = 0,
): PocketEntity {
  const entity = new PocketEntity();
  entity.id = id;
  entity.name = "Test";
  entity.type = type;
  entity.goal = goal;
  entity.accumulatedAmount = accumulatedAmount;
  entity.initialAmount = 0;
  entity.motivation = "";
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  return entity;
}

describe("DeleteWithTransferUseCase", () => {
  let useCase: DeleteWithTransferUseCase;
  let mockRepository: jest.Mocked<PocketRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: any;
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
      delete: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        return cb(mockEntityManager);
      }),
    } as any;

    useCase = new DeleteWithTransferUseCase(mockRepository, mockDataSource);
  });

  describe("pre-transaction validations", () => {
    it("should throw POCKET_NOT_FOUND when source pocket does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          "user-1",
          "invalid-id",
          [{ targetPocketId: "target-1", amount: 100 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("POCKET_NOT_FOUND:invalid-id");
    });

    it("should throw DISTRIBUTION_SUM_MISMATCH when sum does not match balance", async () => {
      const sourcePocket = createMockPocket("source-1", 500);
      mockRepository.findById.mockResolvedValue(sourcePocket);

      await expect(
        useCase.execute(
          "user-1",
          "source-1",
          [{ targetPocketId: "target-1", amount: 100 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("DISTRIBUTION_SUM_MISMATCH:500:100");
    });

    it("should throw SOURCE_IS_TARGET when distribution targets the source pocket", async () => {
      const sourcePocket = createMockPocket("source-1", 500);
      mockRepository.findById.mockResolvedValue(sourcePocket);

      await expect(
        useCase.execute(
          "user-1",
          "source-1",
          [{ targetPocketId: "source-1", amount: 500 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("SOURCE_IS_TARGET:source-1");
    });

    it("should throw POCKET_NOT_FOUND when a target pocket does not exist", async () => {
      const sourcePocket = createMockPocket("source-1", 500);
      mockRepository.findById
        .mockResolvedValueOnce(sourcePocket) // source
        .mockResolvedValueOnce(null); // target not found

      await expect(
        useCase.execute(
          "user-1",
          "source-1",
          [{ targetPocketId: "missing-target", amount: 500 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("POCKET_NOT_FOUND:missing-target");
    });
  });

  describe("atomic transaction", () => {
    beforeEach(() => {
      const sourcePocket = createMockPocket("source-1", 500);
      const targetPocket = createMockPocket("target-1", 200);
      mockRepository.findById
        .mockResolvedValueOnce(sourcePocket) // source exists
        .mockResolvedValueOnce(targetPocket); // target exists
    });

    it("should debit source, credit target, create deposit, and delete pocket", async () => {
      const sourceEntity = createMockEntity("source-1", 500);
      sourceEntity.name = "Test Source";
      const targetEntity = createMockEntity("target-1", 200);
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(sourceEntity) // lock source
        .mockResolvedValueOnce(targetEntity); // lock target

      const mockDepositEntity = {
        id: "dep-1",
        pocketId: "target-1",
        amount: 500,
        date: new Date(),
      };
      mockEntityManager.save.mockResolvedValue(null);
      mockEntityManager.create.mockReturnValue(mockDepositEntity);

      const result = await useCase.execute(
        "user-1",
        "source-1",
        [{ targetPocketId: "target-1", amount: 500 }],
        "Closing pocket",
        new Date(),
      );

      expect(result.deletedPocketId).toBe("source-1");
      expect(result.depositsCreated).toBe(1);
      // saves: source debit + target credit + deposit = 3
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
      // delete old transfers (source + target) + delete deposits + delete pocket = 4 deletes
      expect(mockEntityManager.delete).toHaveBeenCalledTimes(4);
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        PocketTransferEntity,
        expect.objectContaining({ sourcePocketId: "source-1" }),
      );
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        DepositEntity,
        { pocketId: "source-1" },
      );
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        PocketEntity,
        "source-1",
      );
      // Verify deposit was created on the target pocket with the pocket name in the reason
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        DepositEntity,
        expect.objectContaining({
          pocketId: "target-1",
          amount: 500,
          reason: 'Transferencia desde "Test Source" (bolsillo eliminado)',
        }),
      );
    });

    it("should throw TRANSFER_EXCEEDS_GOAL when target is goal and amount exceeds remaining", async () => {
      const sourceEntity = createMockEntity("source-1", 500);
      sourceEntity.name = "Test";
      const goalEntity = createMockEntity("target-1", 800, "goal", 1000); // remaining = 200
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(sourceEntity) // lock source
        .mockResolvedValueOnce(goalEntity); // lock target

      await expect(
        useCase.execute(
          "user-1",
          "source-1",
          [{ targetPocketId: "target-1", amount: 500 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("TRANSFER_EXCEEDS_GOAL:200:500:target-1");
    });

    it("should throw INSUFFICIENT_FUNDS when balance changed after pre-validation", async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(
        createMockEntity("source-1", 100),
      ); // balance now only 100

      await expect(
        useCase.execute(
          "user-1",
          "source-1",
          [{ targetPocketId: "target-1", amount: 500 }],
          "reason",
          new Date(),
        ),
      ).rejects.toThrow("INSUFFICIENT_FUNDS:100:500");
    });

    it("should handle multiple distributions correctly", async () => {
      const sourceEntity = createMockEntity("source-1", 1000);
      sourceEntity.name = "Multi";
      const targetEntity1 = createMockEntity("target-1", 100);
      const targetEntity2 = createMockEntity("target-2", 50);

      mockRepository.findById
        .mockReset()
        .mockResolvedValueOnce(createMockPocket("source-1", 1000))
        .mockResolvedValueOnce(createMockPocket("target-1", 100))
        .mockResolvedValueOnce(createMockPocket("target-2", 50));

      mockQueryBuilder.getOne
        .mockReset()
        .mockResolvedValueOnce(sourceEntity)
        .mockResolvedValueOnce(targetEntity1)
        .mockResolvedValueOnce(targetEntity2);

      mockEntityManager.save.mockResolvedValue(null);
      mockEntityManager.create.mockReturnValue({});

      const result = await useCase.execute(
        "user-1",
        "source-1",
        [
          { targetPocketId: "target-1", amount: 600 },
          { targetPocketId: "target-2", amount: 400 },
        ],
        "split",
        new Date(),
      );

      expect(result.deletedPocketId).toBe("source-1");
      expect(result.depositsCreated).toBe(2);
      // saves: source debit + target-1 credit + deposit-1 + target-2 credit + deposit-2 = 5
      expect(mockEntityManager.save).toHaveBeenCalledTimes(5);
      // creates: 2 deposit records
      expect(mockEntityManager.create).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.create).toHaveBeenNthCalledWith(
        1,
        DepositEntity,
        expect.objectContaining({ pocketId: "target-1", amount: 600 }),
      );
      expect(mockEntityManager.create).toHaveBeenNthCalledWith(
        2,
        DepositEntity,
        expect.objectContaining({ pocketId: "target-2", amount: 400 }),
      );
    });
  });
});
