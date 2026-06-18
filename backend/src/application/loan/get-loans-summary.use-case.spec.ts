import { GetLoansSummaryUseCase } from "./get-loans-summary.use-case";
import { LoanService } from "../../domain/services/loan.service";

describe("GetLoansSummaryUseCase", () => {
  let useCase: GetLoansSummaryUseCase;
  let mockService: jest.Mocked<LoanService>;

  beforeEach(() => {
    mockService = {
      getLoansSummary: jest.fn(),
    } as any;
    useCase = new GetLoansSummaryUseCase(mockService);
  });

  it("should call loanService.getLoansSummary and return summary", async () => {
    const mockSummary = {
      totalLoans: 10,
      totalAmountLent: 10000,
      totalInterest: 1500,
      totalExpectedReturn: 11500,
      totalReceived: 5000,
      totalPending: 6500,
      fullyPaidCount: 3,
      activeLoansCount: 7,
    };
    mockService.getLoansSummary.mockResolvedValue(mockSummary);

    const result = await useCase.execute("user-1");

    expect(mockService.getLoansSummary).toHaveBeenCalled();
    expect(result).toEqual(mockSummary);
  });

  it("should propagate errors from the service", async () => {
    mockService.getLoansSummary.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
