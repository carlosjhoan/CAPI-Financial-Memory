import { DeleteIncomeUseCase } from "./delete-income.use-case";
import { IncomeRepository } from "../../domain/repositories/income.repository";
import { DataSource } from "typeorm";

describe("DeleteIncomeUseCase", () => {
  let useCase: DeleteIncomeUseCase;
  let mockRepo: jest.Mocked<IncomeRepository>;
  let mockDataSource: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn(),
    };

    useCase = new DeleteIncomeUseCase(mockRepo, mockDataSource);
  });

  it("should throw if income not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "999")).rejects.toThrow(
      "Income not found",
    );

    expect(mockRepo.findById).toHaveBeenCalledWith("999", "user-1");
  });

  it("should run transaction when income exists", async () => {
    mockRepo.findById.mockResolvedValue({ id: "1", amount: 100 } as any);
    (mockDataSource.transaction as jest.Mock).mockImplementation(
      async (cb: any) => {
        const mockEntityManager = {
          find: jest.fn().mockResolvedValue([
            { pocketId: "pocket-1", amount: 100 },
            { pocketId: "pocket-2", amount: 50 },
          ]),
          findOne: jest.fn().mockResolvedValue({
            id: "pocket-1",
            accumulatedAmount: 500,
          }),
          save: jest.fn(),
          createQueryBuilder: jest.fn(() => ({
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue(undefined),
          })),
          delete: jest.fn().mockResolvedValue(undefined),
        };
        await cb(mockEntityManager);
      },
    );

    await useCase.execute("user-1", "1");

    expect(mockRepo.findById).toHaveBeenCalledWith("1", "user-1");
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });
});
