import { GetYearlySummaryUseCase } from "./get-yearly-summary.use-case";
import { LoanService } from "../../domain/services/loan.service";

describe("GetYearlySummaryUseCase", () => {
  let useCase: GetYearlySummaryUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getYearlySummary: jest.fn(),
    } as any;
    useCase = new GetYearlySummaryUseCase(mockService);
  });

  it("should call loanService.getYearlySummary with correct year", async () => {
    const mockSummary = {
      year: 2024,
      totalAmountLent: 50000,
      totalInterest: 7500,
      totalReceived: 20000,
      totalPending: 30000,
      count: 10,
      fullyPaidCount: 3,
      activeCount: 7,
      monthlyBreakdown: {
        Jan: 5000,
        Feb: 6000,
        Mar: 4000,
        Apr: 7000,
        May: 8000,
        Jun: 3000,
        Jul: 4000,
        Aug: 5000,
        Sep: 2000,
        Oct: 3000,
        Nov: 0,
        Dec: 0,
      },
      averageMonthly: 5500,
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
