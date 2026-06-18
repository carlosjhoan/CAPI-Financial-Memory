import { RegisterIncomePaymentUseCase } from "./register-income-payment.use-case";
import { IncomeRepository } from "../../domain/repositories/income.repository";
import { Income } from "../../domain/entities/income.entity";

describe("RegisterIncomePaymentUseCase", () => {
  let useCase: RegisterIncomePaymentUseCase;
  let mockRepo: jest.Mocked<IncomeRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new RegisterIncomePaymentUseCase(mockRepo);
  });

  it("should register a payment successfully", async () => {
    const date = new Date("2024-01-15");
    const existingIncome = new Income(100, "Salary", date, "1");
    existingIncome.createdAt = new Date();
    const updatedIncome = new Income(200, "Salary", date, "1");
    updatedIncome.createdAt = existingIncome.createdAt;

    mockRepo.findById.mockResolvedValue(existingIncome);
    mockRepo.update.mockResolvedValue(updatedIncome);

    const result = await useCase.execute("user-1", "1", 100);

    expect(mockRepo.findById).toHaveBeenCalledWith("1", "user-1");
    expect(mockRepo.update).toHaveBeenCalledWith(existingIncome);
    expect(result).toEqual(updatedIncome);
  });

  it("should throw if payment amount is 0", async () => {
    await expect(useCase.execute("user-1", "1", 0)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should throw if payment amount is negative", async () => {
    await expect(useCase.execute("user-1", "1", -50)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should throw if income not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "999", 100)).rejects.toThrow(
      "Income not found",
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("999", "user-1");
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
