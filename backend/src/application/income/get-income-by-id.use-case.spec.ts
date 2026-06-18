import { GetIncomeByIdUseCase } from "./get-income-by-id.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("GetIncomeByIdUseCase", () => {
  let useCase: GetIncomeByIdUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getIncomeById: jest.fn(),
    } as any;
    useCase = new GetIncomeByIdUseCase(mockService);
  });

  it("should call incomeService.getIncomeById with the correct id", async () => {
    const mockIncome = new Income(100, "Salary", new Date(), "1");
    mockService.getIncomeById.mockResolvedValue(mockIncome);

    const result = await useCase.execute("user-1", "1");

    expect(mockService.getIncomeById).toHaveBeenCalledWith("user-1", "1");
    expect(result).toEqual(mockIncome);
  });

  it("should propagate errors from the service", async () => {
    mockService.getIncomeById.mockRejectedValue(new Error("Not found"));

    await expect(useCase.execute("user-1", "999")).rejects.toThrow("Not found");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
