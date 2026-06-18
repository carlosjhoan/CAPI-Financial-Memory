import { RegisterExpensePaymentUseCase } from "./register-expense-payment.use-case";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { Expense } from "../../domain/entities/expense.entity";

describe("RegisterExpensePaymentUseCase", () => {
  let useCase: RegisterExpensePaymentUseCase;
  let mockRepo: jest.Mocked<ExpenseRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new RegisterExpensePaymentUseCase(mockRepo);
  });

  it("should register a payment successfully", async () => {
    const date = new Date("2024-01-15");
    const mockExpense = new Expense(100, "Food", date, "1");
    mockRepo.findById.mockResolvedValue(mockExpense);
    mockRepo.update.mockResolvedValue(mockExpense);

    const result = await useCase.execute("user-1", "1", 50);

    expect(mockRepo.findById).toHaveBeenCalledWith("1", "user-1");
    expect(mockRepo.update).toHaveBeenCalled();
    expect(result).toEqual(mockExpense);
  });

  it("should throw if amount is 0", async () => {
    await expect(useCase.execute("user-1", "1", 0)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw if amount is negative", async () => {
    await expect(useCase.execute("user-1", "1", -50)).rejects.toThrow(
      "Payment amount must be greater than 0",
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw if expense not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "999", 50)).rejects.toThrow(
      "Expense not found",
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
