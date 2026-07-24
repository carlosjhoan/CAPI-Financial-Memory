import { Expense } from "./expense.entity";

describe("Expense", () => {
  it("should have isAdjustment default to false", () => {
    const expense = new Expense(100, "Test", new Date(), "id-1");
    expect(expense.isAdjustment).toBe(false);
  });

  it("should have adjustedRecordId default to null", () => {
    const expense = new Expense(100, "Test", new Date(), "id-1");
    expect(expense.adjustedRecordId).toBeNull();
  });

  it("should have adjustments as empty array by default", () => {
    const expense = new Expense(100, "Test", new Date(), "id-1");
    expect(expense.adjustments).toEqual([]);
  });

  it("should set isAdjustment and adjustedRecordId when provided", () => {
    const expense = new Expense(100, "Adjustment", new Date(), "adj-1", "user-1");
    expense.isAdjustment = true;
    expense.adjustedRecordId = "original-1";
    expect(expense.isAdjustment).toBe(true);
    expect(expense.adjustedRecordId).toBe("original-1");
  });

  it("should have netAmount equal to amount by default", () => {
    const expense = new Expense(500, "Test", new Date(), "id-1");
    expect(expense.netAmount).toBe(500);
  });
});
