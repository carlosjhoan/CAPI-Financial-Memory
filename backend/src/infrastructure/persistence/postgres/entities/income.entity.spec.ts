import { IncomeEntity } from "./income.entity";

describe("IncomeEntity", () => {
  it("should accept assignment to isAdjustment property", () => {
    const entity = new IncomeEntity();
    entity.isAdjustment = true;
    expect(entity.isAdjustment).toBe(true);
    entity.isAdjustment = false;
    expect(entity.isAdjustment).toBe(false);
  });

  it("should accept assignment to adjustedRecordId property", () => {
    const entity = new IncomeEntity();
    entity.adjustedRecordId = "test-id";
    expect(entity.adjustedRecordId).toBe("test-id");
  });
});
