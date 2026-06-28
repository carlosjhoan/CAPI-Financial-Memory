import { CreatePocketUseCase } from "./create-pocket.use-case";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";
import { DataSource } from "typeorm";

describe("CreatePocketUseCase", () => {
  let useCase: CreatePocketUseCase;
  let mockRepo: jest.Mocked<PocketRepository>;
  let mockDataSource: { transaction: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;
    mockDataSource = {
      transaction: jest.fn(),
    };
    useCase = new CreatePocketUseCase(
      mockRepo as any,
      mockDataSource as any,
    );
  });

  // ── Basic creation tests ──

  it("should create a goal-type pocket successfully", async () => {
    const mockPocket = new Pocket(
      "Emergency Fund",
      "goal",
      1000,
      0,
      "Test motivation",
    );
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Emergency Fund",
      "goal",
      1000,
      0,
      "Test motivation",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  it("should create a deposit-type pocket successfully", async () => {
    const mockPocket = new Pocket(
      "Savings",
      "deposit",
      0,
      500,
      "Test motivation",
    );
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Savings",
      "deposit",
      0,
      500,
      "Test motivation",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  // ── sourceType tests ──

  it("should save without creating income when sourceType=external but accumulatedAmount=0", async () => {
    const mockPocket = new Pocket("Test", "deposit", 0, 0, "motivation");
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Test",
      "deposit",
      0,
      0,
      "motivation",
      "external",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  it("should save without creating income when sourceType=transfer even with accumulatedAmount>0", async () => {
    const mockPocket = new Pocket("Test", "deposit", 0, 500, "motivation");
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Test",
      "deposit",
      0,
      500,
      "motivation",
      "transfer",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  // ── Auto-income on external pocket creation ──

  describe("auto-income on external pocket creation", () => {
    function makeTransactionMock() {
      const savedPocketEntity = {
        id: "new-pocket-id",
        accumulatedAmount: 0,
        createdAt: new Date("2026-06-26"),
        updatedAt: new Date("2026-06-26"),
      };
      const savedIncomeEntity = { id: "income-1" };
      const mockEm = {
        create: jest.fn().mockImplementation((Entity: any, data: any) => ({ ...data })),
        save: jest
          .fn()
          .mockResolvedValueOnce(savedPocketEntity) // pocket save
          .mockResolvedValueOnce(savedIncomeEntity)  // income save
          .mockResolvedValueOnce({})                  // allocation save
          .mockResolvedValueOnce({ ...savedPocketEntity, accumulatedAmount: 3000 }), // accumulated update
      } as any;
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: typeof mockEm) => Promise<any>) => cb(mockEm),
      );
      return mockEm;
    }

    it("scenario 2a: accumulatedAmount>0 + sourceType='external' creates income atomically", async () => {
      const mockEm = makeTransactionMock();

      const result = await useCase.execute(
        "user-1",
        "Vacations",
        "goal",
        5000,
        3000,
        "Save for trip",
        "external",
      );

      // Should have used DataSource.transaction
      expect(mockDataSource.transaction).toHaveBeenCalled();
      // Should NOT have used pocketRepository.save directly
      expect(mockRepo.save).not.toHaveBeenCalled();
      // Should have created PocketEntity + IncomeEntity + IncomeAllocationEntity
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: "Vacations", userId: "user-1" }),
      );
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ amount: 3000, reason: "Monto inicial de bolsillo Vacations" }),
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("new-pocket-id");
    });

    it("scenario 2b: accumulatedAmount=0 does NOT create income", async () => {
      const mockPocket = new Pocket("Test", "deposit", 0, 0, "motivation");
      mockRepo.save.mockResolvedValue(mockPocket);

      const result = await useCase.execute(
        "user-1",
        "Test",
        "deposit",
        0,
        0,
        "motivation",
        "external",
      );

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(result).toEqual(mockPocket);
    });

    it("scenario 2c: sourceType='transfer' does NOT create income even with accumulatedAmount>0", async () => {
      const mockPocket = new Pocket("Test", "deposit", 0, 500, "motivation");
      mockRepo.save.mockResolvedValue(mockPocket);

      const result = await useCase.execute(
        "user-1",
        "Test",
        "deposit",
        0,
        500,
        "motivation",
        "transfer",
      );

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(result).toEqual(mockPocket);
    });

    it("scenario 2d: transaction failure propagates error", async () => {
      mockDataSource.transaction.mockImplementation(
        async (_cb: any) => {
          throw new Error("Income creation failed");
        },
      );

      await expect(
        useCase.execute(
          "user-1",
          "Fail",
          "deposit",
          0,
          500,
          "motivation",
          "external",
        ),
      ).rejects.toThrow("Income creation failed");
    });

    it("creates income with correct reason format", async () => {
      const mockEm = makeTransactionMock();

      await useCase.execute(
        "user-1",
        "Mi bolsillo",
        "deposit",
        0,
        1000,
        "motivation",
        "external",
      );

      // Verify income was created with correct reason via the transaction callback
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 1000,
          reason: "Monto inicial de bolsillo Mi bolsillo",
        }),
      );
    });
  });

  // ── Validation error tests ──

  it("should throw if name is empty", async () => {
    await expect(
      useCase.execute("user-1", "", "goal", 1000, 0, "Test motivation"),
    ).rejects.toThrow("Name is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if name is whitespace", async () => {
    await expect(
      useCase.execute("user-1", "   ", "goal", 1000, 0, "Test motivation"),
    ).rejects.toThrow("Name is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if type is invalid", async () => {
    await expect(
      useCase.execute(
        "user-1",
        "Test",
        "invalid" as any,
        1000,
        0,
        "Test motivation",
      ),
    ).rejects.toThrow("Type must be 'goal' or 'deposit'");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if goal is 0 for goal-type pocket", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", 0, 0, "Test motivation"),
    ).rejects.toThrow("Goal must be greater than 0 for goal-type pockets");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if goal is negative for goal-type pocket", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", -100, 0, "Test motivation"),
    ).rejects.toThrow("Goal must be greater than 0 for goal-type pockets");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if accumulated amount is negative", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", 1000, -100, "Test motivation"),
    ).rejects.toThrow("Accumulated amount cannot be negative");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
