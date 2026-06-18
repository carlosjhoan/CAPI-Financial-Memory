import { RegisterLoanPaymentUseCase } from "./register-loan-payment.use-case";
import { LoanRepository } from "../../domain/repositories/loan.repository";
import { Loan } from "../../domain/entities/loan.entity";

describe("RegisterLoanPaymentUseCase", () => {
  let useCase: RegisterLoanPaymentUseCase;
  let mockRepo: jest.Mocked<LoanRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new RegisterLoanPaymentUseCase(mockRepo);
  });

  it("should register a payment successfully", async () => {
    const mockLoan = new Loan(1000, 10, 100, "Juan", new Date());
    mockRepo.findById.mockResolvedValue(mockLoan);
    mockRepo.update.mockResolvedValue(mockLoan);

    const result = await useCase.execute("user-1", "1", 100);

    expect(mockRepo.findById).toHaveBeenCalledWith("1", "user-1");
    expect(mockRepo.update).toHaveBeenCalled();
    expect(result).toEqual(mockLoan);
  });

  it("should throw if amount is 0", async () => {
    await expect(useCase.execute("user-1", "1", 0)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should throw if amount is negative", async () => {
    await expect(useCase.execute("user-1", "1", -100)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should throw if loan not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "999", 100)).rejects.toThrow(
      "Loan not found",
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
