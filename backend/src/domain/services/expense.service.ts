import { Expense } from "../entities/expense.entity";
import { ExpenseRepository } from "../repositories/expense.repository";
import { CreateExpenseUseCase } from "../../application/expense/create-expense.use-case";
import { RegisterExpensePaymentUseCase } from "../../application/expense/register-expense-payment.use-case";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly registerExpensePaymentUseCase: RegisterExpensePaymentUseCase,
  ) {}

  async createExpense(
    userId: string,
    amount: number,
    reason: string,
    date: Date,
    allocations: AllocationDto[],
  ): Promise<Expense> {
    return await this.createExpenseUseCase.execute(userId, amount, reason, date, allocations);
  }

  async registerPayment(userId: string, expenseId: string, amount: number): Promise<Expense> {
    return await this.registerExpensePaymentUseCase.execute(userId, expenseId, amount);
  }

  async getAllExpenses(userId: string): Promise<Expense[]> {
    return await this.expenseRepository.findAll(userId);
  }

  async getAllExpensesPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    return await this.expenseRepository.findAllPaginated(skip, limit, userId);
  }

  async getExpensesByDateRangePaginated(
    userId: string,
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    return await this.expenseRepository.findByDateRangePaginated(
      startDate,
      endDate,
      skip,
      limit,
      userId,
    );
  }

  async getExpenseById(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id, userId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    return expense;
  }

  async updateExpense(
    userId: string,
    id: string,
    updates: {
      amount?: number;
      reason?: string;
      date?: Date;
    },
  ): Promise<Expense> {
    const expense = await this.getExpenseById(userId, id);

    if (updates.amount !== undefined) {
      if (updates.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      expense.amount = updates.amount;
    }

    if (updates.reason !== undefined) {
      if (!updates.reason || updates.reason.trim().length === 0) {
        throw new Error("Reason cannot be empty");
      }
      if (updates.reason.length > 255) {
        throw new Error("Reason cannot be longer than 255 characters");
      }
      expense.reason = updates.reason;
    }

    if (updates.date !== undefined) {
      expense.date = updates.date;
    }

    expense.update(expense.amount, expense.reason, expense.date);
    return await this.expenseRepository.update(expense);
  }

  async deleteExpense(userId: string, id: string): Promise<void> {
    const expense = await this.expenseRepository.findById(id, userId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    await this.expenseRepository.delete(id, userId);
  }

  async getExpensesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Expense[]> {
    const allExpenses = await this.getAllExpenses(userId);
    return allExpenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate,
    );
  }

  async getExpensesSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    averageAmount: number;
    mostExpensive: Expense | null;
    recentExpenses: Expense[];
  }> {
    let expenses = await this.getAllExpenses(userId);

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      expenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });
    }

    if (expenses.length === 0) {
      return {
        totalExpenses: 0,
        totalAmount: 0,
        averageAmount: 0,
        mostExpensive: null,
        recentExpenses: [],
      };
    }

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    const averageAmount = totalAmount / totalExpenses;

    // Encontrar el gasto más caro
    const mostExpensive = expenses.reduce((max, expense) =>
      Number(expense.amount) > Number(max.amount) ? expense : max,
    );

    // Helper para convertir date a Date instance
    const toDate = (date: Date | string): Date =>
      date instanceof Date ? date : new Date(date);

    // Obtener los 5 gastos más recientes
    const recentExpenses = expenses
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime())
      .slice(0, 5);

    return {
      totalExpenses,
      totalAmount,
      averageAmount,
      mostExpensive,
      recentExpenses,
    };
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    expenseCount: number;
    dailyBreakdown: Record<string, number>;
  }> {
    const expenses = await this.getAllExpenses(userId);

    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      // Use UTC methods to avoid timezone shifts (DATE columns are UTC-midnight)
      return (
        expenseDate.getUTCFullYear() === year &&
        expenseDate.getUTCMonth() === month
      );
    });

    const totalAmount = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    // Agrupar por día
    const dailyBreakdown: Record<string, number> = {};
    monthExpenses.forEach((expense) => {
      const day = new Date(expense.date)
        .getUTCDate()
        .toString()
        .padStart(2, "0");
      dailyBreakdown[day] = (dailyBreakdown[day] || 0) + Number(expense.amount);
    });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return {
      month: `${monthNames[month]} ${year}`,
      totalAmount,
      expenseCount: monthExpenses.length,
      dailyBreakdown,
    };
  }

  async getYearlySummary(userId: string, year: number): Promise<{
    year: number;
    totalAmount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    const expenses = await this.getAllExpenses(userId);

    const yearExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      // Use UTC method to avoid timezone shift (DATE columns are UTC-midnight)
      return expenseDate.getUTCFullYear() === year;
    });

    const totalAmount = yearExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    // Agrupar por mes
    const monthlyBreakdown: Record<string, number> = {};
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

    // Inicializar todos los meses con 0
    monthNames.forEach((month) => {
      monthlyBreakdown[month] = 0;
    });

    yearExpenses.forEach((expense) => {
      const monthIndex = new Date(expense.date).getUTCMonth();
      const monthName = monthNames[monthIndex];
      monthlyBreakdown[monthName] += Number(expense.amount);
    });

    const monthsWithData = Object.values(monthlyBreakdown).filter(
      (amount) => amount > 0,
    ).length;
    const averageMonthly =
      monthsWithData > 0 ? totalAmount / monthsWithData : 0;

    return {
      year,
      totalAmount,
      monthlyBreakdown,
      averageMonthly,
    };
  }
}
