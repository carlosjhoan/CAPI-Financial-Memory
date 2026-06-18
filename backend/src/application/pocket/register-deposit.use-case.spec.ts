import { RegisterDepositUseCase } from "./register-deposit.use-case";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";
import { Deposit } from "../../domain/entities/deposit.entity";

describe("RegisterDepositUseCase", () => {
  let useCase: RegisterDepositUseCase;
  let mockRepo: jest.Mocked<PocketRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      saveDeposit: jest.fn(),
    } as any;
    useCase = new RegisterDepositUseCase(mockRepo);
  });

  it("should register a deposit successfully", async () => {
    const mockPocket = new Pocket(
      "Savings",
      "goal",
      1000,
      0,
      "Test motivation",
    );
    const mockDeposit = new Deposit("pocket-1", 100, new Date("2024-01-15"));
    mockRepo.findById.mockResolvedValue(mockPocket);
    mockRepo.update.mockResolvedValue(mockPocket);
    mockRepo.saveDeposit.mockResolvedValue(mockDeposit);

    const result = await useCase.execute(
      "user-1",
      "pocket-1",
      100,
      new Date("2024-01-15"),
    );

    expect(mockRepo.findById).toHaveBeenCalledWith("pocket-1", "user-1");
    expect(mockRepo.update).toHaveBeenCalled();
    expect(mockRepo.saveDeposit).toHaveBeenCalled();
    expect(result).toEqual({ pocket: mockPocket, deposit: mockDeposit });
  });

  it("should throw if amount is 0", async () => {
    await expect(
      useCase.execute("user-1", "pocket-1", 0, new Date()),
    ).rejects.toThrow("Deposit amount must be greater than 0");
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw if amount is negative", async () => {
    await expect(
      useCase.execute("user-1", "pocket-1", -100, new Date()),
    ).rejects.toThrow("Deposit amount must be greater than 0");
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw if pocket not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", "invalid-id", 100, new Date()),
    ).rejects.toThrow("Pocket not found");
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(mockRepo.saveDeposit).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
