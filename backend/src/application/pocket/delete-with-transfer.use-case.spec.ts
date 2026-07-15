import { DeleteWithTransferUseCase } from "./delete-with-transfer.use-case";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";

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
  _accumulatedAmount: number,
  type = "deposit",
  goal = 0,
): PocketEntity {
  const entity = new PocketEntity();
  entity.id = id;
  entity.name = "Test";
  entity.type = type;
  entity.goal = goal;
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
      findIncomesByPocketId: jest.fn(),
      findExpensesByPocketId: jest.fn(),
      findTransfersByPocketId: jest.fn(),
      findHistoryByPocketId: jest.fn(),
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
      update: jest.fn(),
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

    it("should nullify references, process distributions, and delete pocket", async () => {
      const sourceEntity = createMockEntity("source-1", 500);
      sourceEntity.name = "Test Source";
      sourceEntity.userId = "user-1";
      const targetEntity = createMockEntity("target-1", 200);
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(sourceEntity) // lock source
        .mockResolvedValueOnce(targetEntity); // lock target

      const result = await useCase.execute(
        "user-1",
        "source-1",
        [{ targetPocketId: "target-1", amount: 500 }],
        "Closing pocket",
        new Date(),
      );

      expect(result.deletedPocketId).toBe("source-1");
      // saves: source updatedAt + target updatedAt + pocketTransfer = 3
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
      // updates: source transfers nullified + target transfers nullified + income allocations nullified = 3
      expect(mockEntityManager.update).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        PocketTransferEntity,
        { sourcePocketId: "source-1" },
        { sourcePocketId: null, sourcePocketName: "Test Source" },
      );
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        PocketTransferEntity,
        { targetPocketId: "source-1" },
        { targetPocketId: null, targetPocketName: "Test Source" },
      );
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        IncomeAllocationEntity,
        { pocketId: "source-1" },
        { pocketId: null },
      );
      // delete: only the pocket itself
      expect(mockEntityManager.delete).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.delete).toHaveBeenCalledWith(
        PocketEntity,
        "source-1",
      );
      // PocketTransfer created (no Income records)
      expect(mockEntityManager.create).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        PocketTransferEntity,
        {
          sourcePocketId: null,
          sourcePocketName: "Test Source",
          targetPocketId: "target-1",
          amount: 500,
          reason: "Closing pocket",
          date: expect.any(Date),
        },
      );
    });

    it("should throw TRANSFER_EXCEEDS_GOAL when target is goal and amount exceeds remaining", async () => {
      // Override findById so cached target has accumulated=800 → remaining=200 → 500 > 200
      mockRepository.findById
        .mockReset()
        .mockResolvedValueOnce(createMockPocket("source-1", 500))
        .mockResolvedValueOnce(createMockPocket("target-1", 800));

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

    it("should handle multiple distributions correctly", async () => {
      const sourceEntity = createMockEntity("source-1", 1000);
      sourceEntity.name = "Multi";
      sourceEntity.userId = "user-1";
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
      // saves: source updatedAt + target-1 updatedAt + target-2 updatedAt + 2 pocketTransfers = 5
      expect(mockEntityManager.save).toHaveBeenCalledTimes(5);
      // Two PocketTransfer records created (no Income records)
      expect(mockEntityManager.create).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.create).toHaveBeenNthCalledWith(
        1,
        PocketTransferEntity,
        {
          sourcePocketId: null,
          sourcePocketName: "Multi",
          targetPocketId: "target-1",
          amount: 600,
          reason: "split",
          date: expect.any(Date),
        },
      );
      expect(mockEntityManager.create).toHaveBeenNthCalledWith(
        2,
        PocketTransferEntity,
        {
          sourcePocketId: null,
          sourcePocketName: "Multi",
          targetPocketId: "target-2",
          amount: 400,
          reason: "split",
          date: expect.any(Date),
        },
      );
    });
  });
});
