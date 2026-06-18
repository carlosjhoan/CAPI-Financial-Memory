import { UpdateLoanUseCase } from "./update-loan.use-case";
import { LoanService } from "../../domain/services/loan.service";
import { Loan } from "../../domain/entities/loan.entity";

describe("UpdateLoanUseCase", () => {
  let useCase: UpdateLoanUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      updateLoan: jest.fn(),
    } as any;
    useCase = new UpdateLoanUseCase(mockService);
  });

  it("should call loanService.updateLoan with correct id and updates", async () => {
    const mockLoan = new Loan(1000, 10, 100, "Juan", new Date());
    const updates = { interestRate: 12 };
    mockService.updateLoan.mockResolvedValue(mockLoan);

    const result = await useCase.execute("user-1", "1", updates);

    expect(mockService.updateLoan).toHaveBeenCalledWith("user-1", "1", updates);
    expect(result).toEqual(mockLoan);
  });

  it("should propagate errors from the service", async () => {
    mockService.updateLoan.mockRejectedValue(new Error("Invalid update"));

    await expect(useCase.execute("user-1", "1", {})).rejects.toThrow(
      "Invalid update",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
