import { GetYearlySummaryUseCase } from "./get-yearly-summary.use-case";
import { DebtService } from "../../domain/services/debt.service";

describe("GetYearlySummaryUseCase", () => {
  let useCase: GetYearlySummaryUseCase;
  let mockService: jest.Mocked<DebtService>;

  beforeEach(() => {
    mockService = {
      getAllDebts: jest.fn(),
      getAllDebtsPaginated: jest.fn(),
      getDebtById: jest.fn(),
      updateDebt: jest.fn(),
      deleteDebt: jest.fn(),
      getDebtsSummary: jest.fn(),
      getMonthlySummary: jest.fn(),
      getYearlySummary: jest.fn(),
    } as any;
    useCase = new GetYearlySummaryUseCase(mockService);
  });

  describe("execute", () => {
    it("should call debtService.getYearlySummary with year", async () => {
      const mockSummary = {
        year: 2024,
        totalAmount: 50000,
        totalRemaining: 40000,
        count: 10,
        fullyPaidCount: 2,
        activeCount: 8,
        monthlyBreakdown: {
          Jan: 5000,
          Feb: 6000,
          Mar: 4000,
          Apr: 0,
          May: 0,
          Jun: 0,
          Jul: 0,
          Aug: 0,
          Sep: 0,
          Oct: 0,
          Nov: 0,
          Dec: 0,
        },
        averageMonthly: 5000,
      };
      mockService.getYearlySummary.mockResolvedValue(mockSummary);

      const result = await useCase.execute("user-1", 2024);

      expect(mockService.getYearlySummary).toHaveBeenCalledWith("user-1", 2024);
      expect(result).toEqual(mockSummary);
    });

    it("should propagate errors from getYearlySummary", async () => {
      mockService.getYearlySummary.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(useCase.execute("user-1", 2024)).rejects.toThrow(
        "Database error",
      );
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
