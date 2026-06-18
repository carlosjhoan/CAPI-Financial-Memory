import { GetExpenseByIdUseCase } from "./get-expense-by-id.use-case";
import { ExpenseService } from "../../domain/services/expense.service";
import { Expense } from "../../domain/entities/expense.entity";

describe("GetExpenseByIdUseCase", () => {
  let useCase: GetExpenseByIdUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getExpenseById: jest.fn(),
    } as any;
    useCase = new GetExpenseByIdUseCase(mockService);
  });

  it("should call expenseService.getExpenseById with the correct id", async () => {
    const mockExpense = new Expense(100, "Food", new Date(), "1");
    mockService.getExpenseById.mockResolvedValue(mockExpense);

    const result = await useCase.execute("user-1", "1");

    expect(mockService.getExpenseById).toHaveBeenCalledWith("user-1", "1");
    expect(result).toEqual(mockExpense);
  });

  it("should propagate errors from the service", async () => {
    mockService.getExpenseById.mockRejectedValue(new Error("Not found"));

    await expect(useCase.execute("user-1", "999")).rejects.toThrow("Not found");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
