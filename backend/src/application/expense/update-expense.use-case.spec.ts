import { UpdateExpenseUseCase } from "./update-expense.use-case";
import { ExpenseService } from "../../domain/services/expense.service";
import { Expense } from "../../domain/entities/expense.entity";
import { DataSource } from "typeorm";
import { PocketRepository } from "../../domain/repositories/pocket.repository";

describe("UpdateExpenseUseCase", () => {
  let useCase: UpdateExpenseUseCase;
  let mockService: jest.Mocked<ExpenseService>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockPocketRepository: jest.Mocked<PocketRepository>;

  beforeEach(() => {
    mockService = {
      updateExpense: jest.fn(),
    } as any;
    mockDataSource = {
      transaction: jest.fn(),
      manager: {} as any,
    } as any;
    mockPocketRepository = {
      findById: jest.fn(),
    } as any;
    useCase = new UpdateExpenseUseCase(
      mockService,
      mockDataSource,
      mockPocketRepository,
    );
  });

  it("should call expenseService.updateExpense with correct params", async () => {
    const mockExpense = new Expense(200, "Food", new Date(), "1");
    const updates = { amount: 200 };
    mockService.updateExpense.mockResolvedValue(mockExpense);

    const result = await useCase.execute("user-1", "1", updates);

    expect(mockService.updateExpense).toHaveBeenCalledWith(
      "user-1",
      "1",
      updates,
    );
    expect(result).toEqual(mockExpense);
  });

  it("should propagate errors from the service", async () => {
    mockService.updateExpense.mockRejectedValue(new Error("Not found"));

    await expect(useCase.execute("user-1", "999", {})).rejects.toThrow(
      "Not found",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
