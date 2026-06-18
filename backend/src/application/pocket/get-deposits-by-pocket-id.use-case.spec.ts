import { GetDepositsByPocketIdUseCase } from "./get-deposits-by-pocket-id.use-case";
import { PocketService } from "../../domain/services/pocket.service";
import { Deposit } from "../../domain/entities/deposit.entity";

describe("GetDepositsByPocketIdUseCase", () => {
  let useCase: GetDepositsByPocketIdUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      getDepositsByPocketId: jest.fn(),
    } as any;
    useCase = new GetDepositsByPocketIdUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.getDepositsByPocketId with correct pocketId", async () => {
      const mockDeposits = [
        new Deposit("pocket-1", 100, new Date()),
        new Deposit("pocket-1", 200, new Date()),
      ];
      mockService.getDepositsByPocketId.mockResolvedValue(mockDeposits);

      const result = await useCase.execute("user-1", "pocket-1");

      expect(mockService.getDepositsByPocketId).toHaveBeenCalledWith(
        "user-1",
        "pocket-1",
        undefined,
      );
      expect(result).toEqual(mockDeposits);
    });

    it("should propagate errors from getDepositsByPocketId", async () => {
      mockService.getDepositsByPocketId.mockRejectedValue(
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
