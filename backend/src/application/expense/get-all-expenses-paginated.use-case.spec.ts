import { GetAllExpensesPaginatedUseCase } from "./get-all-expenses-paginated.use-case";
import { ExpenseService } from "../../domain/services/expense.service";
import { Expense } from "../../domain/entities/expense.entity";

describe("GetAllExpensesPaginatedUseCase", () => {
  let useCase: GetAllExpensesPaginatedUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getAllExpensesPaginated: jest.fn(),
    } as any;
    useCase = new GetAllExpensesPaginatedUseCase(mockService);
  });

  it("should call expenseService.getAllExpensesPaginated with correct skip and limit", async () => {
    const mockResult = {
      data: [new Expense(100, "Food", new Date(), "1")],
      total: 1,
    };
    mockService.getAllExpensesPaginated.mockResolvedValue(mockResult);

    const result = await useCase.execute("user-1", 0, 10);

    expect(mockService.getAllExpensesPaginated).toHaveBeenCalledWith(
      "user-1",
      0,
      10,
    );
    expect(result).toEqual(mockResult);
  });

  it("should propagate errors from the service", async () => {
    mockService.getAllExpensesPaginated.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(useCase.execute("user-1", 0, 10)).rejects.toThrow(
      "Database error",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
