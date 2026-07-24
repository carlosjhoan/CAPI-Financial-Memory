import { CreateExpenseAdjustmentUseCase } from "./create-expense-adjustment.use-case";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { Expense } from "../../domain/entities/expense.entity";
import { Pocket } from "../../domain/entities/pocket.entity";

describe("CreateExpenseAdjustmentUseCase", () => {
  let useCase: CreateExpenseAdjustmentUseCase;
  let mockExpenseRepo: jest.Mocked<ExpenseRepository>;
  let mockPocketRepo: jest.Mocked<PocketRepository>;
  let mockDataSource: jest.Mocked<DataSource>;

  const createMockExpense = (override: Partial<Expense> = {}): Expense => {
    const expense = new Expense(100, "Food", new Date("2024-01-15"), "expense-1", "user-1");
    expense.allocations = [{ pocketId: "pocket-1", pocketName: "Main", amount: 100 }];
    Object.assign(expense, override);
    return expense;
  };

  beforeEach(() => {
    mockExpenseRepo = {
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

    useCase = new CreateExpenseAdjustmentUseCase(
      mockExpenseRepo,
      mockPocketRepo,
      mockDataSource,
    );
  });

  it("should create an EXPENSE adjustment with positive amount when editing UP (delta > 0)", async () => {
    mockExpenseRepo.findById.mockResolvedValue(createMockExpense());

    const result = await useCase.execute("user-1", "expense-1", {
      amount: 150,
      reason: "More expensive",
      date: "2024-01-20",
    });

    expect(result.type).toBe("expense");
    expect(result.amount).toBe(50);
    expect(result.adjustedRecordId).toBe("expense-1");
    expect(result.isAdjustment).toBe(true);
  });

  it("should create an EXPENSE adjustment with negative amount when editing DOWN (delta < 0)", async () => {
    mockExpenseRepo.findById.mockResolvedValue(createMockExpense());

    const result = await useCase.execute("user-1", "expense-1", {
      amount: 60,
      reason: "Less expensive",
      date: "2024-01-20",
    });

    expect(result.type).toBe("expense");
    expect(result.amount).toBe(-40);
    expect(result.adjustedRecordId).toBe("expense-1");
    expect(result.isAdjustment).toBe(true);
  });

  it("should distribute delta pro-rata across pockets with correct sign", async () => {
    const expense = createMockExpense({
      amount: 200,
      allocations: [
        { pocketId: "pocket-a", pocketName: "A", amount: 120 },
        { pocketId: "pocket-b", pocketName: "B", amount: 80 },
      ],
    });
    mockExpenseRepo.findById.mockResolvedValue(expense);

    // Increase case
    const result = await useCase.execute("user-1", "expense-1", {
      amount: 250,
      reason: "Increased",
      date: "2024-01-20",
    });

    expect(result.type).toBe("expense");
    expect(result.amount).toBe(50);
    expect(result.allocations).toHaveLength(2);
    const allocSum = result.allocations.reduce((s: number, a: any) => s + a.amount, 0);
    expect(Math.abs(allocSum - 50)).toBeLessThan(0.02);
  });

  it("should reject with goal overflow when adjustment exceeds goal remaining", async () => {
    mockExpenseRepo.findById.mockResolvedValue(createMockExpense({
      amount: 100,
      allocations: [{ pocketId: "goal-1", pocketName: "Goal", amount: 100 }],
    }));
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Vacation Goal", "goal", 50, 0, "Dream", "goal-1"),
    );

    await expect(
      useCase.execute("user-1", "expense-1", {
        amount: 1000,
        reason: "Over goal",
        date: "2024-01-20",
      }),
    ).rejects.toThrow(/goal overflow/i);
  });

  it("should succeed when adjustment is within goal remaining", async () => {
    mockExpenseRepo.findById.mockResolvedValue(createMockExpense({
      allocations: [{ pocketId: "goal-1", pocketName: "Goal", amount: 50 }],
    }));
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Goal", "goal", 0, 500, "Dream", "goal-1"),
    );

    const result = await useCase.execute("user-1", "expense-1", {
      amount: 1000,
      reason: "Within goal (no limit)",
      date: "2024-01-20",
    });

    expect(result.amount).toBe(900);
    expect(result.adjustedRecordId).toBe("expense-1");
  });

  it("should throw 404 when original expense not found", async () => {
    mockExpenseRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", "nonexistent", {
        amount: 150,
        reason: "Not found",
        date: "2024-01-20",
      }),
    ).rejects.toThrow("not found");
  });
});
