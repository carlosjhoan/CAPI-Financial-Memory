import { Expense } from "../../../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../../../domain/repositories/expense.repository";

export class InMemoryExpenseRepository implements ExpenseRepository {
  private expenses: Map<string, Expense> = new Map();
  private nextId = 1;

  async save(expense: Expense): Promise<Expense> {
    if (!expense.id) {
      expense.id = `in-memory-${this.nextId++}`;
    }
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async findById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) || null;
  }

  async findAll(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async findAllPaginated(
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    const allExpenses = Array.from(this.expenses.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const total = allExpenses.length;
    const data = allExpenses.slice(skip, skip + limit);
    return { data, total };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) =>
        new Date(expense.date) >= startDate &&
        new Date(expense.date) <= endDate,
    );
  }

  async findByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    const filtered = Array.from(this.expenses.values())
      .filter(
        (expense) =>
          new Date(expense.date) >= startDate &&
          new Date(expense.date) <= endDate,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit);
    return { data, total };
  }

  async update(expense: Expense): Promise<Expense> {
    if (!this.expenses.has(expense.id)) {
      throw new Error("Expense not found");
    }
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async delete(id: string): Promise<void> {
    this.expenses.delete(id);
  }

  async getMonthlySummary(
    year: number,
    month: number,
  ): Promise<{
    totalAmount: number;
    count: number;
    averageAmount: number;
  }> {
    const monthExpenses = Array.from(this.expenses.values()).filter(
      (expense) => {
        const d = new Date(expense.date);
        return d.getUTCFullYear() === year && d.getUTCMonth() === month;
      },
    );

    const count = monthExpenses.length;
    const totalAmount = monthExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const averageAmount = count > 0 ? totalAmount / count : 0;

    return { totalAmount, count, averageAmount };
  }

  async getYearlySummary(year: number): Promise<{
    totalAmount: number;
    count: number;
    monthlyBreakdown: Record<string, number>;
  }> {
    const yearExpenses = Array.from(this.expenses.values()).filter(
      (expense) => new Date(expense.date).getUTCFullYear() === year,
    );

    const totalAmount = yearExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const count = yearExpenses.length;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyBreakdown: Record<string, number> = {};
    monthNames.forEach((m) => (monthlyBreakdown[m] = 0));

    yearExpenses.forEach((expense) => {
      const monthIndex = new Date(expense.date).getUTCMonth();
      monthlyBreakdown[monthNames[monthIndex]] += Number(expense.amount);
    });

    return { totalAmount, count, monthlyBreakdown };
  }
}
