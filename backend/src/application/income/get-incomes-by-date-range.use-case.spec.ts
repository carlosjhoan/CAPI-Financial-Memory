import { GetIncomesByDateRangeUseCase } from "./get-incomes-by-date-range.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("GetIncomesByDateRangeUseCase", () => {
  let useCase: GetIncomesByDateRangeUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getIncomesByDateRange: jest.fn(),
    } as any;
    useCase = new GetIncomesByDateRangeUseCase(mockService);
  });

  it("should call incomeService.getIncomesByDateRange with correct dates", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");
    const mockIncomes = [
      new Income(100, "Salary", new Date("2024-01-15"), "1"),
    ];
    mockService.getIncomesByDateRange.mockResolvedValue(mockIncomes);

    const result = await useCase.execute("user-1", startDate, endDate);

    expect(mockService.getIncomesByDateRange).toHaveBeenCalledWith(
      "user-1",
      startDate,
      endDate,
    );
    expect(result).toEqual(mockIncomes);
  });

  it("should propagate errors from the service", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");
    mockService.getIncomesByDateRange.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(useCase.execute("user-1", startDate, endDate)).rejects.toThrow(
      "Database error",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
