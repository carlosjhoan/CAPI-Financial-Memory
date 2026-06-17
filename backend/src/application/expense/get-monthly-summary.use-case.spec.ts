import { GetMonthlySummaryUseCase } from "./get-monthly-summary.use-case";
import { ExpenseService } from "../../domain/services/expense.service";

describe("GetMonthlySummaryUseCase", () => {
  let useCase: GetMonthlySummaryUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getMonthlySummary: jest.fn(),
    } as any;
    useCase = new GetMonthlySummaryUseCase(mockService);
  });

  it("should call expenseService.getMonthlySummary with correct year and month", async () => {
    const mockSummary = {
      month: "January 2024",
      totalAmount: 100,
      expenseCount: 1,
      dailyBreakdown: { "15": 100 },
    };
    mockService.getMonthlySummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute('user-1', 2024, 0);

    expect(mockService.getMonthlySummary).toHaveBeenCalledWith('user-1', 2024, 0);
    expect(result).toEqual(mockSummary);
  });

  it("should propagate errors from the service", async () => {
    mockService.getMonthlySummary.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(useCase.execute('user-1', 2024, 0)).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});