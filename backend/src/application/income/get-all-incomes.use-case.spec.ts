import { GetAllIncomesUseCase } from "./get-all-incomes.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("GetAllIncomesUseCase", () => {
  let useCase: GetAllIncomesUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      getAllIncomes: jest.fn(),
      getAllIncomesPaginated: jest.fn(),
    } as any;
    useCase = new GetAllIncomesUseCase(mockService);
  });

  describe("execute", () => {
    it("should call incomeService.getAllIncomes and return incomes", async () => {
      const mockIncomes = [
        new Income(100, "Salary", new Date(), "1"),
        new Income(200, "Freelance", new Date(), "2"),
      ];
      mockService.getAllIncomes.mockResolvedValue(mockIncomes);

      const result = await useCase.execute("user-1");

      expect(mockService.getAllIncomes).toHaveBeenCalled();
      expect(result).toEqual(mockIncomes);
    });

    it("should propagate errors from getAllIncomes", async () => {
      mockService.getAllIncomes.mockRejectedValue(new Error("Database error"));

      await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
    });
  });

  describe("executePaginated", () => {
    it("should call incomeService.getAllIncomesPaginated with correct params", async () => {
      const mockResult = {
        data: [new Income(100, "Salary", new Date(), "1")],
        total: 1,
      };
      mockService.getAllIncomesPaginated.mockResolvedValue(mockResult);

      const result = await useCase.executePaginated("user-1", 0, 10);

      expect(mockService.getAllIncomesPaginated).toHaveBeenCalledWith(
        "user-1",
        0,
        10,
      );
      expect(result).toEqual(mockResult);
    });

    it("should propagate errors from getAllIncomesPaginated", async () => {
      mockService.getAllIncomesPaginated.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(useCase.executePaginated("user-1", 0, 10)).rejects.toThrow(
        "Database error",
      );
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
