import { GetYearlySummaryUseCase } from "./get-yearly-summary.use-case";
import { IncomeService } from "../../domain/services/income.service";

describe("GetYearlySummaryUseCase", () => {
  let useCase: GetYearlySummaryUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getYearlySummary: jest.fn(),
    } as any;
    useCase = new GetYearlySummaryUseCase(mockService);
  });

  it("should call incomeService.getYearlySummary with the correct year", async () => {
    const mockSummary = {
      year: 2024,
      totalAmount: 3600,
      monthlyBreakdown: {
        Jan: 300,
        Feb: 300,
        Mar: 300,
        Apr: 300,
        May: 300,
        Jun: 300,
        Jul: 300,
        Aug: 300,
        Sep: 300,
        Oct: 300,
        Nov: 300,
        Dec: 300,
      },
      averageMonthly: 300,
    };
    mockService.getYearlySummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute("user-1", 2024);

    expect(mockService.getYearlySummary).toHaveBeenCalledWith("user-1", 2024);
    expect(result).toEqual(mockSummary);
  });

  it("should propagate errors from the service", async () => {
    mockService.getYearlySummary.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute("user-1", 2024)).rejects.toThrow(
      "Database error",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
