import { GetAllDebtsUseCase } from "./get-all-debts.use-case";
import { DebtService } from "../../domain/services/debt.service";
import { Debt } from "../../domain/entities/debt.entity";

describe("GetAllDebtsUseCase", () => {
  let useCase: GetAllDebtsUseCase;
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
    useCase = new GetAllDebtsUseCase(mockService);
  });

  describe("execute", () => {
    it("should call debtService.getAllDebts and return debts", async () => {
      const mockDebts = [
        new Debt(1000, "Bank A", 12, 100, 1200, new Date(), "Reason", "1"),
        new Debt(2000, "Bank B", 24, 100, 2400, new Date(), "Reason", "2"),
      ];
      mockService.getAllDebts.mockResolvedValue(mockDebts);

      const result = await useCase.execute("user-1");

      expect(mockService.getAllDebts).toHaveBeenCalled();
      expect(result).toEqual(mockDebts);
    });

    it("should propagate errors from getAllDebts", async () => {
      mockService.getAllDebts.mockRejectedValue(new Error("Database error"));

      await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
