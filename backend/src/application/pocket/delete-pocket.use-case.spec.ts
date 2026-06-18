import { DeletePocketUseCase } from "./delete-pocket.use-case";
import { PocketService } from "../../domain/services/pocket.service";

describe("DeletePocketUseCase", () => {
  let useCase: DeletePocketUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      deletePocket: jest.fn(),
    } as any;
    useCase = new DeletePocketUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.deletePocket with correct id", async () => {
      mockService.deletePocket.mockResolvedValue();

      await useCase.execute("user-1", "pocket-1");

      expect(mockService.deletePocket).toHaveBeenCalledWith(
        "user-1",
        "pocket-1",
      );
    });

    it("should propagate errors from deletePocket", async () => {
      mockService.deletePocket.mockRejectedValue(new Error("Pocket not found"));

      await expect(useCase.execute("user-1", "invalid-id")).rejects.toThrow(
        "Pocket not found",
      );
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
