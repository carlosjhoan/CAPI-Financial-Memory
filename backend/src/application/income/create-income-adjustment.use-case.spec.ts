import { CreateIncomeAdjustmentUseCase } from "./create-income-adjustment.use-case";
import { IncomeRepository } from "../../domain/repositories/income.repository";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { Income } from "../../domain/entities/income.entity";
import { Pocket } from "../../domain/entities/pocket.entity";

describe("CreateIncomeAdjustmentUseCase", () => {
  let useCase: CreateIncomeAdjustmentUseCase;
  let mockIncomeRepo: jest.Mocked<IncomeRepository>;
  let mockPocketRepo: jest.Mocked<PocketRepository>;
  let mockDataSource: jest.Mocked<DataSource>;

  const createMockIncome = (override: Partial<Income> = {}): Income => {
    const income = new Income(1000, "Salary", new Date("2024-01-15"), "income-1", "user-1");
    income.allocations = [{ pocketId: "pocket-1", pocketName: "Main", amount: 1000 }];
    Object.assign(income, override);
    return income;
  };

  beforeEach(() => {
    mockIncomeRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;
    mockPocketRepo = {
      findById: jest.fn(),
    } as any;
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb: any) =>
        cb({
          create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data })),
          save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: "new-id" })),
          findOne: jest.fn(),
        }),
      ),
    } as any;

    useCase = new CreateIncomeAdjustmentUseCase(
      mockIncomeRepo,
      mockPocketRepo,
      mockDataSource,
    );
  });

  // ── Business Rules ──

  it("should create an INCOME adjustment with negative amount when editing DOWN (delta < 0)", async () => {
    mockIncomeRepo.findById.mockResolvedValue(createMockIncome());

    const result = await useCase.execute("user-1", "income-1", {
      amount: 800,
      reason: "Salary correction",
      date: "2024-01-20",
    });

    expect(result.type).toBe("income");
    expect(result.amount).toBe(-200);
    expect(result.adjustedRecordId).toBe("income-1");
    expect(result.isAdjustment).toBe(true);
  });

  it("should create an INCOME adjustment with positive amount when editing UP (delta > 0)", async () => {
    mockIncomeRepo.findById.mockResolvedValue(createMockIncome());

    const result = await useCase.execute("user-1", "income-1", {
      amount: 1200,
      reason: "Bonus addition",
      date: "2024-01-20",
    });

    expect(result.type).toBe("income");
    expect(result.amount).toBe(200);
    expect(result.adjustedRecordId).toBe("income-1");
    expect(result.isAdjustment).toBe(true);
  });

  // ── Pro-rata Distribution ──

  it("should distribute delta pro-rata across pockets with correct sign", async () => {
    const income = createMockIncome({
      amount: 100,
      allocations: [
        { pocketId: "pocket-a", pocketName: "A", amount: 33.33 },
        { pocketId: "pocket-b", pocketName: "B", amount: 33.33 },
        { pocketId: "pocket-c", pocketName: "C", amount: 33.34 },
      ],
    });
    mockIncomeRepo.findById.mockResolvedValue(income);

    const result = await useCase.execute("user-1", "income-1", {
      amount: 80,
      reason: "Reduced",
      date: "2024-01-20",
    });

    expect(result.type).toBe("income");
    expect(result.amount).toBe(-20);
    // Pro-rata: $20 split 33.33/33.33/33.34 ≈ 6.67/6.67/6.66, then negated
    const allocSum = result.allocations.reduce((s: number, a: any) => s + a.amount, 0);
    expect(Math.abs(allocSum - (-20))).toBeLessThan(0.02);
  });

  // ── Goal Overflow ──

  it("should reject with 422 when adjustment exceeds goal remaining", async () => {
    mockIncomeRepo.findById.mockResolvedValue(createMockIncome({
      amount: 100,
      allocations: [{ pocketId: "goal-1", pocketName: "Vacation Goal", amount: 100 }],
    }));
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Vacation Goal", "goal", 50, 0, "Dream vacation", "goal-1"),
    );

    await expect(
      useCase.execute("user-1", "income-1", {
        amount: 1000,
        reason: "Over goal",
        date: "2024-01-20",
      }),
    ).rejects.toThrow(/goal overflow/i);
  });

  it("should succeed when adjustment is within goal remaining", async () => {
    mockIncomeRepo.findById.mockResolvedValue(createMockIncome({
      allocations: [{ pocketId: "goal-1", pocketName: "Vacation Goal", amount: 50 }],
    }));
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Vacation Goal", "goal", 0, 500, "Dream vacation", "goal-1"),
    );

    const result = await useCase.execute("user-1", "income-1", {
      amount: 1050,
      reason: "Within goal",
      date: "2024-01-20",
    });

    expect(result.amount).toBe(50);
    expect(result.adjustedRecordId).toBe("income-1");
  });

  // ── Full POST flow ──

  it("should save adjustment record with isAdjustment=true (full POST flow)", async () => {
    mockIncomeRepo.findById.mockResolvedValue(createMockIncome());

    let savedIncomeEntity: any = null;
    const mockManager = {
      create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data })),
      save: jest.fn().mockImplementation((entityOrClass: any, entityData?: any) => {
        const data = entityData || entityOrClass;
        if (!Array.isArray(data)) {
          savedIncomeEntity = { ...data, id: "adj-1" };
        }
        return Promise.resolve(data);
      }),
      findOne: jest.fn(),
    };
    mockDataSource.transaction = jest.fn().mockImplementation((cb: any) => cb(mockManager));

    await useCase.execute("user-1", "income-1", {
      amount: 800,
      reason: "Full flow test",
      date: "2024-01-20",
    });

    expect(savedIncomeEntity).not.toBeNull();
    expect(savedIncomeEntity.isAdjustment).toBe(true);
    expect(savedIncomeEntity.adjustedRecordId).toBe("income-1");
    expect(savedIncomeEntity.amount).toBe(-200);
    expect(savedIncomeEntity.reason).toContain("[Ajuste]");
  });

  it("should throw 404 when original income not found", async () => {
    mockIncomeRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", "nonexistent", {
        amount: 800,
        reason: "Not found",
        date: "2024-01-20",
      }),
    ).rejects.toThrow("not found");
  });
});
