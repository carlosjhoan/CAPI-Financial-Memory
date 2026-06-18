import { CreatePocketUseCase } from "./create-pocket.use-case";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";

describe("CreatePocketUseCase", () => {
  let useCase: CreatePocketUseCase;
  let mockRepo: jest.Mocked<PocketRepository>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;
    useCase = new CreatePocketUseCase(mockRepo);
  });

  it("should create a goal-type pocket successfully", async () => {
    const mockPocket = new Pocket(
      "Emergency Fund",
      "goal",
      1000,
      0,
      "Test motivation",
    );
    mockPocket.initialAmount = 0;
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Emergency Fund",
      "goal",
      1000,
      0,
      "Test motivation",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  it("should create a deposit-type pocket successfully", async () => {
    const mockPocket = new Pocket(
      "Savings",
      "deposit",
      0,
      500,
      "Test motivation",
    );
    mockPocket.initialAmount = 500;
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Savings",
      "deposit",
      0,
      500,
      "Test motivation",
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
  });

  it("should use initialAmount when provided", async () => {
    const mockPocket = new Pocket("Fund", "goal", 1000, 500, "Test motivation");
    mockPocket.initialAmount = 200;
    mockRepo.save.mockResolvedValue(mockPocket);

    const result = await useCase.execute(
      "user-1",
      "Fund",
      "goal",
      1000,
      500,
      "Test motivation",
      200,
    );

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockPocket);
    expect(result.initialAmount).toBe(200);
  });

  it("should throw if name is empty", async () => {
    await expect(
      useCase.execute("user-1", "", "goal", 1000, 0, "Test motivation"),
    ).rejects.toThrow("Name is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if name is whitespace", async () => {
    await expect(
      useCase.execute("user-1", "   ", "goal", 1000, 0, "Test motivation"),
    ).rejects.toThrow("Name is required");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if type is invalid", async () => {
    await expect(
      useCase.execute(
        "user-1",
        "Test",
        "invalid" as any,
        1000,
        0,
        "Test motivation",
      ),
    ).rejects.toThrow("Type must be 'goal' or 'deposit'");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if goal is 0 for goal-type pocket", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", 0, 0, "Test motivation"),
    ).rejects.toThrow("Goal must be greater than 0 for goal-type pockets");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if goal is negative for goal-type pocket", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", -100, 0, "Test motivation"),
    ).rejects.toThrow("Goal must be greater than 0 for goal-type pockets");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw if accumulated amount is negative", async () => {
    await expect(
      useCase.execute("user-1", "Test", "goal", 1000, -100, "Test motivation"),
    ).rejects.toThrow("Accumulated amount cannot be negative");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
