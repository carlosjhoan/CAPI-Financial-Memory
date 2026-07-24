import { ExpenseController } from "./expense.controller";
import { ForbiddenException } from "@nestjs/common";
import { ExpenseService } from "../../../domain/services/expense.service";

describe("ExpenseController — 403 guards (Task 4.10)", () => {
  let controller: ExpenseController;
  let mockExpenseService: jest.Mocked<ExpenseService>;

  beforeEach(() => {
    mockExpenseService = {
      getExpenseById: jest.fn(),
    } as any;

    controller = new ExpenseController(
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
      mockExpenseService,
    );
  });

  it("should throw ForbiddenException when PUT targets an adjustment record", async () => {
    mockExpenseService.getExpenseById.mockResolvedValue({
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
    mockExpenseService.getExpenseById.mockResolvedValue({
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
    mockExpenseService.getExpenseById.mockResolvedValue({
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
});
