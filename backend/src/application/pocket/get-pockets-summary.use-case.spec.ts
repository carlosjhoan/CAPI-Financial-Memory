import { GetPocketsSummaryUseCase } from "./get-pockets-summary.use-case";
import { PocketService } from "../../domain/services/pocket.service";

describe("GetPocketsSummaryUseCase", () => {
  let useCase: GetPocketsSummaryUseCase;
  let mockService: jest.Mocked<PocketService>;

  beforeEach(() => {
    mockService = {
      getPocketsSummary: jest.fn(),
    } as any;
    useCase = new GetPocketsSummaryUseCase(mockService);
  });

  describe("execute", () => {
    it("should call pocketService.getPocketsSummary and return summary", async () => {
      const mockSummary = {
        totalAccumulated: 1500,
        totalGoal: 3000,
        count: 5,
      };
      mockService.getPocketsSummary.mockResolvedValue(mockSummary);

      const result = await useCase.execute("user-1");

      expect(mockService.getPocketsSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });

    it("should propagate errors from getPocketsSummary", async () => {
      mockService.getPocketsSummary.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(useCase.execute("user-1")).rejects.toThrow("Database error");
    });
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });
});
