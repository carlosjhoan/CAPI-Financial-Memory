import { GetAllIncomesPaginatedUseCase } from "./get-all-incomes-paginated.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("GetAllIncomesPaginatedUseCase", () => {
  let useCase: GetAllIncomesPaginatedUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getAllIncomesPaginated: jest.fn(),
    } as any;
    useCase = new GetAllIncomesPaginatedUseCase(mockService);
  });

  it("should call incomeService.getAllIncomesPaginated with correct skip and limit", async () => {
    const mockResult = {
      data: [new Income(100, "Salary", new Date(), "1")],
      total: 1,
    };
    mockService.getAllIncomesPaginated.mockResolvedValue(mockResult);

    const result = await useCase.execute("user-1", 0, 10);

    expect(mockService.getAllIncomesPaginated).toHaveBeenCalledWith(
      "user-1",
      0,
      10,
    );
    expect(result).toEqual(mockResult);
  });

  it("should propagate errors from the service", async () => {
    mockService.getAllIncomesPaginated.mockRejectedValue(
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
