import { GetAllPocketsUseCase } from "./get-all-pockets.use-case";
import { PocketService } from "../../domain/services/pocket.service";
import { Pocket } from "../../domain/entities/pocket.entity";

describe("GetAllPocketsUseCase", () => {
  let useCase: GetAllPocketsUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      getAllPockets: jest.fn(),
    } as any;
    useCase = new GetAllPocketsUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.getAllPockets and return pockets", async () => {
      const mockPockets = [
        new Pocket("Savings", "goal", 1000, 500, "Test motivation"),
        new Pocket("Emergency", "deposit", 0, 300, "Test motivation"),
      ];
      mockService.getAllPockets.mockResolvedValue(mockPockets);

      const result = await useCase.execute("user-1");

      expect(mockService.getAllPockets).toHaveBeenCalled();
      expect(result).toEqual(mockPockets);
    });

    it("should propagate errors from getAllPockets", async () => {
      mockService.getAllPockets.mockRejectedValue(new Error("Database error"));

      await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
