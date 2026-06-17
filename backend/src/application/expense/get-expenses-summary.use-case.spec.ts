import { GetExpensesSummaryUseCase } from "./get-expenses-summary.use-case";
import { ExpenseService } from "../../domain/services/expense.service";
import { Expense } from "../../domain/entities/expense.entity";

describe("GetExpensesSummaryUseCase", () => {
  let useCase: GetExpensesSummaryUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getExpensesSummary: jest.fn(),
    } as any;
    useCase = new GetExpensesSummaryUseCase(mockService);
  });

  it("should call expenseService.getExpensesSummary", async () => {
    const mockSummary = {
      totalExpenses: 1,
      totalAmount: 100,
      averageAmount: 100,
      mostExpensive: new Expense(100, "Food", new Date(), "1"),
      recentExpenses: [],
    };
    mockService.getExpensesSummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute('user-1');

    expect(mockService.getExpensesSummary).toHaveBeenCalled();
    expect(result).toEqual(mockSummary);
  });

  it("should propagate errors from the service", async () => {
    mockService.getExpensesSummary.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(useCase.execute('user-1')).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});