import { GetIncomesByDateRangePaginatedUseCase } from "./get-incomes-by-date-range-paginated.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("GetIncomesByDateRangePaginatedUseCase", () => {
  let useCase: GetIncomesByDateRangePaginatedUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getIncomesByDateRangePaginated: jest.fn(),
    } as any;
    useCase = new GetIncomesByDateRangePaginatedUseCase(mockService);
  });

  it("should call incomeService.getIncomesByDateRangePaginated with correct params", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");
    const mockResult = {
      data: [new Income(100, "Salary", new Date("2024-01-15"), "1")],
      total: 1,
    };
    mockService.getIncomesByDateRangePaginated.mockResolvedValue(mockResult);

    const result = await useCase.execute("user-1", startDate, endDate, 0, 10);

    expect(mockService.getIncomesByDateRangePaginated).toHaveBeenCalledWith(
      "user-1",
      startDate,
      endDate,
      0,
      10,
    );
    expect(result).toEqual(mockResult);
  });

  it("should propagate errors from the service", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");
    mockService.getIncomesByDateRangePaginated.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      useCase.execute("user-1", startDate, endDate, 0, 10),
    ).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
