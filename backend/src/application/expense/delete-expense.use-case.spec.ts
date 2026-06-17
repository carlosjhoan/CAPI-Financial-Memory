import { DeleteExpenseUseCase } from "./delete-expense.use-case";
import { ExpenseService } from "../../domain/services/expense.service";

describe("DeleteExpenseUseCase", () => {
  let useCase: DeleteExpenseUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      deleteExpense: jest.fn(),
    } as any;
    useCase = new DeleteExpenseUseCase(mockService);
  });

  it("should call expenseService.deleteExpense with the correct id", async () => {
    mockService.deleteExpense.mockResolvedValue();

    await useCase.execute('user-1', "1");

    expect(mockService.deleteExpense).toHaveBeenCalledWith('user-1', "1");
  });

  it("should propagate errors from the service", async () => {
    mockService.deleteExpense.mockRejectedValue(new Error("Not found"));

    await expect(useCase.execute('user-1', "999")).rejects.toThrow("Not found");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});