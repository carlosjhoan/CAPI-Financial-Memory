import { GetOverdueLoansUseCase } from "./get-overdue-loans.use-case";
import { LoanService } from "../../domain/services/loan.service";
import { Loan } from "../../domain/entities/loan.entity";

describe("GetOverdueLoansUseCase", () => {
  let useCase: GetOverdueLoansUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getOverdueLoans: jest.fn(),
    } as any;
    useCase = new GetOverdueLoansUseCase(mockService);
  });

  it("should call loanService.getOverdueLoans and return loans", async () => {
    const mockLoans = [new Loan(1000, 10, 100, "Juan", new Date())];
    mockService.getOverdueLoans.mockResolvedValue(mockLoans);

    const result = await useCase.execute("user-1");

    expect(mockService.getOverdueLoans).toHaveBeenCalled();
    expect(result).toEqual(mockLoans);
  });

  it("should propagate errors from the service", async () => {
    mockService.getOverdueLoans.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
