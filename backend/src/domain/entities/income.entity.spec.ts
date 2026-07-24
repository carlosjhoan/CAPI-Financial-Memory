import { Income } from "./income.entity";

describe("Income", () => {
  it("should have isAdjustment default to false", () => {
    const income = new Income(100, "Test", new Date(), "id-1");
    expect(income.isAdjustment).toBe(false);
  });

  it("should have adjustedRecordId default to null", () => {
    const income = new Income(100, "Test", new Date(), "id-1");
    expect(income.adjustedRecordId).toBeNull();
  });

  it("should have adjustments as empty array by default", () => {
    const income = new Income(100, "Test", new Date(), "id-1");
    expect(income.adjustments).toEqual([]);
  });

  it("should set isAdjustment and adjustedRecordId when provided", () => {
    const income = new Income(100, "Adjustment", new Date(), "adj-1", "user-1");
    income.isAdjustment = true;
    income.adjustedRecordId = "original-1";
    expect(income.isAdjustment).toBe(true);
    expect(income.adjustedRecordId).toBe("original-1");
  });

  it("should have netAmount equal to amount by default", () => {
    const income = new Income(500, "Test", new Date(), "id-1");
    expect(income.netAmount).toBe(500);
  });

  // ── Timeline filter (Task 4.9) ──

  it("should compute netAmount from adjustments (timeline display)", () => {
    const income = new Income(1000, "Salary", new Date(), "orig-1");
    const adj1 = new Income(200, "[Ajuste] Bonus", new Date(), "adj-1");
    const adj2 = new Income(50, "[Ajuste] Correction", new Date(), "adj-2");
    income.adjustments = [adj1, adj2];
    const adjSum = income.adjustments.reduce((s, a) => s + a.amount, 0);
    income.netAmount = income.amount + adjSum;
    expect(income.netAmount).toBe(1250);
    expect(income.adjustments).toHaveLength(2);
  });

  it("should filter out isAdjustment=true records from timeline data", () => {
    const records = [
      { amount: 100, isAdjustment: false },
      { amount: 200, isAdjustment: false },
      { amount: 50, isAdjustment: true },
    ];
    const timelineRecords = records.filter((r) => !r.isAdjustment);
    expect(timelineRecords).toHaveLength(2);
    expect(timelineRecords.every((r) => !r.isAdjustment)).toBe(true);
  });
});
