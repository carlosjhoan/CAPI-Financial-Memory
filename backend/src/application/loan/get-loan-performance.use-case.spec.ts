import { GetLoanPerformanceUseCase } from "./get-loan-performance.use-case";
import { LoanService } from "../../domain/services/loan.service";
import { Loan } from "../../domain/entities/loan.entity";

describe("GetLoanPerformanceUseCase", () => {
  let useCase: GetLoanPerformanceUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getLoanPerformance: jest.fn(),
    } as any;
    useCase = new GetLoanPerformanceUseCase(mockService);
  });

  it("should call loanService.getLoanPerformance with correct loanId", async () => {
    const mockLoan = new Loan(1000, 10, 100, "Juan", new Date());
    const mockPerformance = {
      loan: mockLoan,
      monthsSinceStart: 6,
      expectedPayments: 6,
      actualPayments: 4,
      paymentRatio: 0.67,
      isOnTrack: false,
      monthsBehind: 2,
      expectedCompletionDate: new Date(),
    };
    mockService.getLoanPerformance.mockResolvedValue(mockPerformance);

    const result = await useCase.execute("user-1", "1");

    expect(mockService.getLoanPerformance).toHaveBeenCalledWith("user-1", "1");
    expect(result).toEqual(mockPerformance);
  });

  it("should propagate errors from the service", async () => {
    mockService.getLoanPerformance.mockRejectedValue(
      new Error("Loan not found"),
    );

    await expect(useCase.execute("user-1", "999")).rejects.toThrow(
      "Loan not found",
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
