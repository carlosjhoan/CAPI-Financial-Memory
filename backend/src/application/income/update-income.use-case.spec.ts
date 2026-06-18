import { UpdateIncomeUseCase } from "./update-income.use-case";
import { IncomeService } from "../../domain/services/income.service";
import { Income } from "../../domain/entities/income.entity";

describe("UpdateIncomeUseCase", () => {
  let useCase: UpdateIncomeUseCase;
  let mockService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockService = {
      updateIncome: jest.fn(),
    } as any;
    useCase = new UpdateIncomeUseCase(mockService);
  });

  it("should call incomeService.updateIncome with the correct id and updates", async () => {
    const mockIncome = new Income(200, "Updated Salary", new Date(), "1");
    const updates = { amount: 200, reason: "Updated Salary" };
    mockService.updateIncome.mockResolvedValue(mockIncome);

    const result = await useCase.execute("user-1", "1", updates);

    expect(mockService.updateIncome).toHaveBeenCalledWith(
      "user-1",
      "1",
      updates,
    );
    expect(result).toEqual(mockIncome);
  });

  it("should propagate errors from the service", async () => {
    const updates = { amount: 200 };
    mockService.updateIncome.mockRejectedValue(new Error("Income not found"));

    await expect(useCase.execute("user-1", "999", updates)).rejects.toThrow(
      "Income not found",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
