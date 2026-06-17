import { Income } from "../../../../domain/entities/income.entity";
import { IncomeRepository } from "../../../../domain/repositories/income.repository";

export class InMemoryIncomeRepository implements IncomeRepository {
  private incomes: Map<string, Income> = new Map();

  async save(income: Income): Promise<Income> {
    this.incomes.set(income.id, income);
    return income;
  }

  async findById(id: string): Promise<Income | null> {
    return this.incomes.get(id) || null;
  }

  async findAll(): Promise<Income[]> {
    return Array.from(this.incomes.values());
  }

  // Helper para convertir date a Date instance
  private toDate(date: Date | string): Date {
    return date instanceof Date ? date : new Date(date);
  }

  async findAllPaginated(
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    const allIncomes = Array.from(this.incomes.values()).sort(
      (a, b) => this.toDate(b.date).getTime() - this.toDate(a.date).getTime(),
    );
    const total = allIncomes.length;
    const data = allIncomes.slice(skip, skip + limit);
    return { data, total };
  }

  async update(income: Income): Promise<Income> {
    if (!this.incomes.has(income.id)) {
      throw new Error("Income not found");
    }
    this.incomes.set(income.id, income);
    return income;
  }

  async delete(id: string): Promise<void> {
    this.incomes.delete(id);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Income[]> {
    const allIncomes = await this.findAll();
    return allIncomes.filter((income) => {
      const incomeDate = this.toDate(income.date);
      return incomeDate >= startDate && incomeDate <= endDate;
    });
  }

  async findByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    const filteredIncomes = Array.from(this.incomes.values())
      .filter((income) => {
        const incomeDate = this.toDate(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      })
      .sort(
        (a, b) => this.toDate(b.date).getTime() - this.toDate(a.date).getTime(),
      );
    const total = filteredIncomes.length;
    const data = filteredIncomes.slice(skip, skip + limit);
    return { data, total };
  }
}
