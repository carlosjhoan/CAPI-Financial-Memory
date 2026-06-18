import { GetExpensesByDateRangePaginatedUseCase } from "./get-expenses-by-date-range-paginated.use-case";
import { ExpenseService } from "../../domain/services/expense.service";
import { Expense } from "../../domain/entities/expense.entity";

describe("GetExpensesByDateRangePaginatedUseCase", () => {
  let useCase: GetExpensesByDateRangePaginatedUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getExpensesByDateRangePaginated: jest.fn(),
    } as any;
    useCase = new GetExpensesByDateRangePaginatedUseCase(mockService);
  });

  it("should call expenseService.getExpensesByDateRangePaginated with correct params", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");
    const mockResult = {
      data: [new Expense(100, "Food", new Date(), "1")],
      total: 1,
    };
    mockService.getExpensesByDateRangePaginated.mockResolvedValue(mockResult);

    const result = await useCase.execute("user-1", startDate, endDate, 0, 10);

    expect(mockService.getExpensesByDateRangePaginated).toHaveBeenCalledWith(
      "user-1",
      startDate,
      endDate,
      0,
      10,
    );
    expect(result).toEqual(mockResult);
  });

  it("should propagate errors from the service", async () => {
    mockService.getExpensesByDateRangePaginated.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      useCase.execute("user-1", new Date(), new Date(), 0, 10),
    ).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
