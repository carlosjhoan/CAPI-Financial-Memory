import { CreateExpenseUseCase } from "./create-expense.use-case";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";
import { DataSource } from "typeorm";

describe("CreateExpenseUseCase", () => {
  let useCase: CreateExpenseUseCase;
  let mockRepo: jest.Mocked<ExpenseRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockPocketRepo: jest.Mocked<PocketRepository>;

  const mockAllocations = [{ pocketId: "uuid-1", amount: 100 }];

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb: any) =>
        cb({
          create: jest
            .fn()
            .mockImplementation((_entity: any, data: any) => ({ ...data })),
          save: jest
            .fn()
            .mockImplementation((entity: any) =>
              Promise.resolve({ ...entity, id: "uuid-1" }),
            ),
        }),
      ),
    } as any;

    mockPocketRepo = {
      findById: jest.fn(),
    } as any;

    useCase = new CreateExpenseUseCase(
      mockRepo,
      mockDataSource,
      mockPocketRepo,
    );
  });

  it("should create an expense successfully", async () => {
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Test Pocket", "deposit", 0, 500, "Motivation", "uuid-1"),
    );

    const date = new Date("2024-01-15");

    const result = await useCase.execute(
      "user-1",
      100,
      "Food",
      date,
      mockAllocations,
    );

    expect(mockPocketRepo.findById).toHaveBeenCalledWith("uuid-1", "user-1");
    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(result.amount).toBe(100);
    expect(result.reason).toBe("Food");
    expect(result.id).toBe("uuid-1");
  });

  it("should throw if amount is 0", async () => {
    await expect(
      useCase.execute("user-1", 0, "Food", new Date(), mockAllocations),
    ).rejects.toThrow("Amount must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if amount is negative", async () => {
    await expect(
      useCase.execute("user-1", -100, "Food", new Date(), mockAllocations),
    ).rejects.toThrow("Amount must be greater than 0");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if reason is empty", async () => {
    await expect(
      useCase.execute("user-1", 100, "", new Date(), mockAllocations),
    ).rejects.toThrow("Reason is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if reason is whitespace", async () => {
    await expect(
      useCase.execute("user-1", 100, "   ", new Date(), mockAllocations),
    ).rejects.toThrow("Reason is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if pocket does not exist", async () => {
    mockPocketRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", 100, "Food", new Date(), mockAllocations),
    ).rejects.toThrow("El bolsillo con ID uuid-1 no existe");
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it("should throw if pocket has insufficient funds", async () => {
    mockPocketRepo.findById.mockResolvedValue(
      new Pocket("Test Pocket", "deposit", 0, 50, "Motivation", "uuid-1"),
    );

    await expect(
      useCase.execute("user-1", 100, "Food", new Date(), mockAllocations),
    ).rejects.toThrow(/Fondos insuficientes en el bolsillo "Test Pocket"/);
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
