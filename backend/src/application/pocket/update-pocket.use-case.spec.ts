import { UpdatePocketUseCase } from "./update-pocket.use-case";
import { PocketService } from "../../domain/services/pocket.service";
import { Pocket } from "../../domain/entities/pocket.entity";

describe("UpdatePocketUseCase", () => {
  let useCase: UpdatePocketUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      updatePocket: jest.fn(),
    } as any;
    useCase = new UpdatePocketUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.updatePocket with correct params", async () => {
      const mockPocket = new Pocket(
        "Updated Savings",
        "goal",
        2000,
        500,
        "Test motivation",
      );
      const updates = { name: "Updated Savings", goal: 2000 };
      mockService.updatePocket.mockResolvedValue(mockPocket);

      const result = await useCase.execute("user-1", "pocket-1", updates);

      expect(mockService.updatePocket).toHaveBeenCalledWith(
        "user-1",
        "pocket-1",
        updates,
      );
      expect(result).toEqual(mockPocket);
    });

    it("should propagate errors from updatePocket", async () => {
      mockService.updatePocket.mockRejectedValue(new Error("Pocket not found"));

      await expect(
        useCase.execute("user-1", "invalid-id", { name: "Test" }),
      ).rejects.toThrow("Pocket not found");
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
