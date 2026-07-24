import { IncomeController } from "./income.controller";
import { ForbiddenException } from "@nestjs/common";
import { IncomeService } from "../../../domain/services/income.service";

describe("IncomeController — 403 guards (Task 4.10)", () => {
  let controller: IncomeController;
  let mockIncomeService: jest.Mocked<IncomeService>;

  beforeEach(() => {
    mockIncomeService = {
      getIncomeById: jest.fn(),
    } as any;

    // All use cases are unused in these tests — mock with empty objects
    controller = new IncomeController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      mockIncomeService,
    );
  });

  it("should throw ForbiddenException when PUT targets an adjustment record", async () => {
    mockIncomeService.getIncomeById.mockResolvedValue({
      isAdjustment: true,
    } as any);

    await expect(
      controller.update(
        { user: { id: "user-1" } } as any,
        "adj-id",
        { amount: 100 } as any,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException when DELETE targets an adjustment record", async () => {
    mockIncomeService.getIncomeById.mockResolvedValue({
      isAdjustment: true,
    } as any);

    await expect(
      controller.remove(
        { user: { id: "user-1" } } as any,
        "adj-id",
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException when POST :id/adjustments targets an adjustment record", async () => {
    mockIncomeService.getIncomeById.mockResolvedValue({
      isAdjustment: true,
    } as any);

    await expect(
      controller.createAdjustment(
        { user: { id: "user-1" } } as any,
        "adj-id",
        { amount: 200, reason: "Test" } as any,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should allow PUT on a non-adjustment record", async () => {
    mockIncomeService.getIncomeById.mockResolvedValue({
      isAdjustment: false,
    } as any);

    // Should not throw — just needs to not reach ForbiddenException
    await expect(
      controller.update(
        { user: { id: "user-1" } } as any,
        "normal-id",
        { amount: 100 } as any,
      ),
    ).rejects.not.toThrow(ForbiddenException);
    // May throw other errors (use case not configured), but NOT ForbiddenException
  });
});
