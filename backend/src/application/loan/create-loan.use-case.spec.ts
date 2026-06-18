import { CreateLoanUseCase } from "./create-loan.use-case";
import { LoanRepository } from "../../domain/repositories/loan.repository";
import { Loan } from "../../domain/entities/loan.entity";

describe("CreateLoanUseCase", () => {
  let useCase: CreateLoanUseCase;
  let mockRepo: jest.Mocked<LoanRepository>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;
    useCase = new CreateLoanUseCase(mockRepo);
  });

  it("should create a loan successfully", async () => {
    const date = new Date("2024-01-15");
    const mockLoan = new Loan(1000, 10, 100, "Juan", date);
    mockRepo.save.mockResolvedValue(mockLoan);

    const result = await useCase.execute("user-1", 1000, 10, 100, "Juan", date);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockLoan);
  });

  it("should throw if initialAmount is 0", async () => {
    await expect(
      useCase.execute("user-1", 0, 10, 100, "Juan", new Date()),
    ).rejects.toThrow("Initial amount must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if initialAmount is negative", async () => {
    await expect(
      useCase.execute("user-1", -1000, 10, 100, "Juan", new Date()),
    ).rejects.toThrow("Initial amount must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if interestRate is negative", async () => {
    await expect(
      useCase.execute("user-1", 1000, -10, 100, "Juan", new Date()),
    ).rejects.toThrow("Interest rate cannot be negative");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if installment is 0", async () => {
    await expect(
      useCase.execute("user-1", 1000, 10, 0, "Juan", new Date()),
    ).rejects.toThrow("Installment must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if installment is negative", async () => {
    await expect(
      useCase.execute("user-1", 1000, 10, -100, "Juan", new Date()),
    ).rejects.toThrow("Installment must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if debtor is empty", async () => {
    await expect(
      useCase.execute("user-1", 1000, 10, 100, "", new Date()),
    ).rejects.toThrow("Debtor is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if debtor is whitespace", async () => {
    await expect(
      useCase.execute("user-1", 1000, 10, 100, "   ", new Date()),
    ).rejects.toThrow("Debtor is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
