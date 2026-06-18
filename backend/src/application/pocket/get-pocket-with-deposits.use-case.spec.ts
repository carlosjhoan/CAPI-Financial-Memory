import { GetPocketWithDepositsUseCase } from "./get-pocket-with-deposits.use-case";
import { PocketService } from "../../domain/services/pocket.service";
import { Pocket } from "../../domain/entities/pocket.entity";
import { Deposit } from "../../domain/entities/deposit.entity";

describe("GetPocketWithDepositsUseCase", () => {
  let useCase: GetPocketWithDepositsUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      getPocketWithDeposits: jest.fn(),
    } as any;
    useCase = new GetPocketWithDepositsUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.getPocketWithDeposits with correct id", async () => {
      const mockPocket = new Pocket(
        "Savings",
        "goal",
        1000,
        500,
        "Test motivation",
      );
      const mockDeposits = [
        new Deposit("pocket-1", 100, new Date()),
        new Deposit("pocket-1", 200, new Date()),
      ];
      mockService.getPocketWithDeposits.mockResolvedValue({
        pocket: mockPocket,
        deposits: mockDeposits,
        expenses: [],
      });

      const result = await useCase.execute("user-1", "pocket-1");

      expect(mockService.getPocketWithDeposits).toHaveBeenCalledWith(
        "user-1",
        "pocket-1",
      );
      expect(result).toEqual({
        pocket: mockPocket,
        deposits: mockDeposits,
        expenses: [],
      });
    });

    it("should propagate errors from getPocketWithDeposits", async () => {
      mockService.getPocketWithDeposits.mockRejectedValue(
        new Error("Pocket not found"),
      );

      await expect(useCase.execute("user-1", "invalid-id")).rejects.toThrow(
        "Pocket not found",
      );
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
