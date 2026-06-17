import { GetYearlySummaryUseCase } from "./get-yearly-summary.use-case";
import { ExpenseService } from "../../domain/services/expense.service";

describe("GetYearlySummaryUseCase", () => {
  let useCase: GetYearlySummaryUseCase;
  let mockService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockService = {
      getYearlySummary: jest.fn(),
    } as any;
    useCase = new GetYearlySummaryUseCase(mockService);
  });

  it("should call expenseService.getYearlySummary with correct year", async () => {
    const mockSummary = {
      year: 2024,
      totalAmount: 1200,
      monthlyBreakdown: {
        Jan: 100,
        Feb: 100,
        Mar: 100,
        Apr: 100,
        May: 100,
        Jun: 100,
        Jul: 100,
        Aug: 100,
        Sep: 100,
        Oct: 100,
        Nov: 100,
        Dec: 100,
      },
      averageMonthly: 100,
    };
    mockService.getYearlySummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute('user-1', 2024);

    expect(mockService.getYearlySummary).toHaveBeenCalledWith('user-1', 2024);
    expect(result).toEqual(mockSummary);
  });

  it("should propagate errors from the service", async () => {
    mockService.getYearlySummary.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute('user-1', 2024)).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});