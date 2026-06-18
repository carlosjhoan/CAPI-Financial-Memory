import { DeleteLoanUseCase } from "./delete-loan.use-case";
import { LoanService } from "../../domain/services/loan.service";

describe("DeleteLoanUseCase", () => {
  let useCase: DeleteLoanUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      deleteLoan: jest.fn(),
    } as any;
    useCase = new DeleteLoanUseCase(mockService);
  });

  it("should call loanService.deleteLoan with the correct id", async () => {
    mockService.deleteLoan.mockResolvedValue();

    await useCase.execute("user-1", "1");

    expect(mockService.deleteLoan).toHaveBeenCalledWith("user-1", "1");
  });

  it("should propagate errors from the service", async () => {
    mockService.deleteLoan.mockRejectedValue(new Error("Cannot delete"));

    await expect(useCase.execute("user-1", "1")).rejects.toThrow(
      "Cannot delete",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
