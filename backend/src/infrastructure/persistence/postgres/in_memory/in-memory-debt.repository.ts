import { Debt } from "../../../../domain/entities/debt.entity";
import { DebtRepository } from "../../../../domain/repositories/debt.repository";
import { DebtQueryDto } from "../../../web/dto/debt-query.dto";

export class InMemoryDebtRepository implements DebtRepository {
  private debts: Map<string, Debt> = new Map();

  async save(debt: Debt): Promise<Debt> {
    this.debts.set(debt.id, debt);
    return debt;
  }

  async findById(id: string): Promise<Debt | null> {
    return this.debts.get(id) || null;
  }

  async findAll(): Promise<Debt[]> {
    return Array.from(this.debts.values());
  }

  async findAllPaginated(
    query: DebtQueryDto,
  ): Promise<{ data: Debt[]; total: number }> {
    let debts = Array.from(this.debts.values());

    // Apply lender filter
    if (query.lender) {
      const lenderLower = query.lender.toLowerCase();
      debts = debts.filter((d) => d.lender.toLowerCase().includes(lenderLower));
    }

    // Apply date filters
    if (query.startDate) {
      const start = new Date(query.startDate + "T00:00:00.000Z");
      debts = debts.filter((d) => d.date >= start);
    }
    if (query.endDate) {
      const end = new Date(query.endDate + "T23:59:59.999Z");
      debts = debts.filter((d) => d.date <= end);
    }

    const total = debts.length;
    const page = query?.page || 1;
    const limit = query?.limit || 6;
    const skip = (page - 1) * limit;

    const data = debts.slice(skip, skip + limit);

    return { data, total };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Debt[]> {
    return Array.from(this.debts.values()).filter((debt) => {
      return debt.date >= startDate && debt.date <= endDate;
    });
  }

  async getMonthlySummary(
    year: number,
    month: number,
  ): Promise<{
    totalAmount: number;
    count: number;
    byLender: Record<string, number>;
  }> {
    const debts = Array.from(this.debts.values()).filter((debt) => {
      const d = new Date(debt.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });

    const totalAmount = debts.reduce(
      (sum, debt) => sum + Number(debt.finalAmount),
      0,
    );
    const count = debts.length;
    const byLender: Record<string, number> = {};

    debts.forEach((debt) => {
      byLender[debt.lender] =
        (byLender[debt.lender] || 0) + Number(debt.finalAmount);
    });

    return { totalAmount, count, byLender };
  }

  async getYearlySummary(year: number): Promise<{
    monthlyBreakdown: { month: number; total: number; count: number }[];
  }> {
    const debts = Array.from(this.debts.values()).filter((debt) => {
      return new Date(debt.date).getUTCFullYear() === year;
    });

    const monthlyMap: Record<number, { total: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = { total: 0, count: 0 };
    }

    debts.forEach((debt) => {
      const month = new Date(debt.date).getUTCMonth() + 1; // 1-indexed
      monthlyMap[month].total += Number(debt.finalAmount);
      monthlyMap[month].count += 1;
    });

    const monthlyBreakdown = Object.entries(monthlyMap).map(
      ([month, data]) => ({
        month: parseInt(month),
        total: data.total,
        count: data.count,
      }),
    );

    return { monthlyBreakdown };
  }

  async update(debt: Debt): Promise<Debt> {
    if (!this.debts.has(debt.id)) {
      throw new Error("Debt not found");
    }
    this.debts.set(debt.id, debt);
    return debt;
  }

  async delete(id: string): Promise<void> {
    this.debts.delete(id);
  }
}
